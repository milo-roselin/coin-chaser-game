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
    const result = await db.insert(scores).values(insertScore).returning();
    return result[0];
  }

  async getTopScores(limit: number): Promise<Array<Score & { username: string }>> {
    // Use raw SQL with CTE to get highest score per user, with total coin bank
    const result = await db.execute(sql`
      WITH ranked_scores AS (
        SELECT s.id, s.user_id, s.score, s.level, s.created_at, u.username, u.coin_bank,
               ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.score DESC) as rn
        FROM scores s
        JOIN users u ON s.user_id = u.id
      )
      SELECT id, user_id as "userId", score, coin_bank as "coins", level, created_at as "createdAt", username
      FROM ranked_scores 
      WHERE rn = 1
      ORDER BY score DESC
      LIMIT ${limit}
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      score: row.score,
      coins: row.coins,
      level: row.level,
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
}

export const storage = new DatabaseStorage();
