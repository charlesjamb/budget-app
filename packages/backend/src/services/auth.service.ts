import { eq, and, gt, lte } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type AppDatabase } from "../db/connection.js";
import { users, sessions, householdMembers } from "../db/schema.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createAuthService(db: AppDatabase) {
  function cleanupExpiredSessions() {
    const now = new Date().toISOString();
    db.delete(sessions).where(lte(sessions.expiresAt, now)).run();
  }

  return {
    async login(email: string, password: string) {
      cleanupExpiredSessions();

      const user = db.select().from(users).where(eq(users.email, email)).get();

      if (!user) {
        return null;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return null;
      }

      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

      db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt }).run();

      const membership = db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, user.id))
        .get();

      return {
        sessionId,
        user: { id: user.id, email: user.email, displayName: user.displayName },
        householdId: membership?.householdId ?? null,
      };
    },

    logout(sessionId: string) {
      db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    },

    getUserFromSession(sessionId: string) {
      const now = new Date().toISOString();

      const session = db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
        .get();

      if (!session) {
        return null;
      }

      const user = db.select().from(users).where(eq(users.id, session.userId)).get();

      if (!user) {
        return null;
      }

      const membership = db
        .select()
        .from(householdMembers)
        .where(eq(householdMembers.userId, user.id))
        .get();

      return {
        user: { id: user.id, email: user.email, displayName: user.displayName },
        householdId: membership?.householdId ?? null,
      };
    },
  };
}
