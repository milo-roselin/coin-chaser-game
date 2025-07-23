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
    const result = await db
      .select({
        id: scores.id,
        userId: scores.userId,
        score: scores.score,
        coins: scores.coins,
        level: scores.level,
        createdAt: scores.createdAt,
        username: users.username,
      })
      .from(scores)
      .innerJoin(users, eq(scores.userId, users.id))
      .orderBy(desc(scores.score))
      .limit(limit);
    
    return result;
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
