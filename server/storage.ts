import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, scores, type User, type InsertUser, type Score, type InsertScore } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sqlConnection = neon(connectionString);
const db = drizzle(sqlConnection);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  insertUser(user: InsertUser): Promise<User>;
  insertScore(score: InsertScore): Promise<Score>;
  getTopScores(limit: number): Promise<Array<Score & { username: string }>>;
  getUserScores(userId: number): Promise<Score[]>;
  updateUserCoinBank(userId: number, coinBank: number): Promise<void>;
  addCoinsToBank(userId: number, coins: number): Promise<number>;
  getMaxCoinBank(): Promise<number>;
  applyScorePenalty(userId: number, penalty: number): Promise<{ previousScore: number; newScore: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async insertUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async insertScore(insertScore: InsertScore): Promise<Score> {
    try {
      // Check if user already has a score
      const existingScore = await db
        .select()
        .from(scores)
        .where(eq(scores.userId, insertScore.userId))
        .limit(1);

    if (existingScore.length > 0) {
      // User has existing score - update if new score is higher
      if (insertScore.score > existingScore[0].score) {
        const result = await db
          .update(scores)
          .set({
            score: insertScore.score,
            coins: insertScore.coins,
            level: Math.max(existingScore[0].level || 1, insertScore.level), // Level represents highest completed
            createdAt: new Date()
          })
          .where(eq(scores.userId, insertScore.userId))
          .returning();
        return result[0];
      } else {
        // Return existing score if new score is not higher
        return existingScore[0];
      }
    } else {
      // User has no existing score - insert new one
      const result = await db.insert(scores).values(insertScore).returning();
      return result[0];
    }
    } catch (error: any) {
      // Handle unique constraint violation - fallback to update logic
      if (error.code === '23505' && error.constraint === 'unique_user_score') {
        console.log(`Unique constraint violation for user ${insertScore.userId}, attempting update...`);
        
        // Get existing score and compare
        const existingScore = await db
          .select()
          .from(scores)
          .where(eq(scores.userId, insertScore.userId))
          .limit(1);
          
        if (existingScore.length > 0 && insertScore.score > existingScore[0].score) {
          // Update with higher score
          const result = await db
            .update(scores)
            .set({
              score: insertScore.score,
              coins: insertScore.coins,
              level: Math.max(existingScore[0].level || 1, insertScore.level), // Level represents highest completed
              createdAt: new Date()
            })
            .where(eq(scores.userId, insertScore.userId))
            .returning();
          return result[0];
        } else {
          // Return existing score
          return existingScore[0] || insertScore as Score;
        }
      }
      throw error;
    }
  }

  async getTopScores(limit: number): Promise<Array<Score & { username: string }>> {
    // Since each user now has only one score, we can simplify the query
    const result = await db.execute(sql`
      SELECT s.id, s.user_id as "userId", s.score, u.coin_bank as "coins", 
             s.level, s.created_at as "createdAt", u.username
      FROM scores s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.score DESC
      LIMIT ${limit}
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      score: row.score,
      coins: row.coins,
      level: row.level || 1,
      createdAt: new Date(row.createdAt),
      username: row.username
    }));
  }

  async getUserScores(userId: number): Promise<Score[]> {
    const result = await db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(desc(scores.score));
    
    return result;
  }

  async updateUserCoinBank(userId: number, coinBank: number): Promise<void> {
    await db
      .update(users)
      .set({ coinBank })
      .where(eq(users.id, userId));
  }

  async addCoinsToBank(userId: number, coins: number): Promise<number> {
    // Get current coin bank
    const [user] = await db
      .select({ coinBank: users.coinBank })
      .from(users)
      .where(eq(users.id, userId));

    const newCoinBank = user.coinBank + coins;

    // Update with new total
    await db
      .update(users)
      .set({ coinBank: newCoinBank })
      .where(eq(users.id, userId));

    return newCoinBank;
  }

  async getMaxCoinBank(): Promise<number> {
    const result = await db
      .select({ maxCoinBank: sql<number>`MAX(${users.coinBank})` })
      .from(users);
    
    return result[0]?.maxCoinBank || 0;
  }

  async applyScorePenalty(userId: number, penalty: number): Promise<{ previousScore: number; newScore: number }> {
    // Get user's current highest score
    const existingScores = await db
      .select()
      .from(scores)
      .where(eq(scores.userId, userId))
      .orderBy(desc(scores.score))
      .limit(1);

    const previousScore = existingScores.length > 0 ? existingScores[0].score : 0;
    const newScore = Math.max(0, previousScore - penalty); // Don't go below 0

    if (existingScores.length > 0) {
      // Update existing score directly
      await db
        .update(scores)
        .set({
          score: newScore,
          createdAt: new Date()
        })
        .where(eq(scores.id, existingScores[0].id));
    } else {
      // Create new score entry if none exists
      await db.insert(scores).values({
        userId,
        score: newScore,
        coins: 0,
        level: 0
      });
    }

    return { previousScore, newScore };
  }
}

export const storage = new DatabaseStorage();
