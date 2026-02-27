import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { createTestDb } from "../db/connection.js";
import {
  users,
  households,
  householdMembers,
} from "../db/schema.js";
import { createContributionService } from "./contribution.service.js";

describe("Contribution Service", () => {
  let db: ReturnType<typeof createTestDb>;
  let service: ReturnType<typeof createContributionService>;
  let householdId: number;
  let userId1: number;
  let userId2: number;

  beforeEach(async () => {
    db = createTestDb();

    db.insert(households).values({ name: "Test Household" }).run();
    const passwordHash = await bcrypt.hash("password123", 10);
    db.insert(users)
      .values([
        { email: "user1@example.com", passwordHash },
        { email: "user2@example.com", passwordHash },
      ])
      .run();
    db.insert(householdMembers)
      .values([
        { userId: 1, householdId: 1 },
        { userId: 2, householdId: 1 },
      ])
      .run();

    householdId = 1;
    userId1 = 1;
    userId2 = 2;
    service = createContributionService(db);
  });

  describe("getByMonth", () => {
    it("should return all household members with 0 revenue when none set", () => {
      const members = service.getByMonth(householdId, "2026-02");
      expect(members).toHaveLength(2);
      expect(members).toContainEqual({
        userId: userId1,
        email: "user1@example.com",
        revenueCents: 0,
      });
      expect(members).toContainEqual({
        userId: userId2,
        email: "user2@example.com",
        revenueCents: 0,
      });
    });

    it("should return stored revenues when set", () => {
      service.upsert(householdId, "2026-02", userId1, 420000);
      service.upsert(householdId, "2026-02", userId2, 229000);

      const members = service.getByMonth(householdId, "2026-02");
      expect(members).toHaveLength(2);
      expect(members.find((m) => m.userId === userId1)?.revenueCents).toBe(
        420000,
      );
      expect(members.find((m) => m.userId === userId2)?.revenueCents).toBe(
        229000,
      );
    });

    it("should return 0 for members without stored revenue", () => {
      service.upsert(householdId, "2026-02", userId1, 420000);

      const members = service.getByMonth(householdId, "2026-02");
      expect(members.find((m) => m.userId === userId1)?.revenueCents).toBe(
        420000,
      );
      expect(members.find((m) => m.userId === userId2)?.revenueCents).toBe(0);
    });
  });

  describe("upsert", () => {
    it("should insert new contribution", () => {
      const result = service.upsert(householdId, "2026-02", userId1, 420000);
      expect(result?.userId).toBe(userId1);
      expect(result?.revenueCents).toBe(420000);
    });

    it("should update existing contribution", () => {
      service.upsert(householdId, "2026-02", userId1, 420000);
      const result = service.upsert(householdId, "2026-02", userId1, 500000);
      expect(result?.revenueCents).toBe(500000);
    });

    it("should allow 0 revenue", () => {
      service.upsert(householdId, "2026-02", userId1, 420000);
      const result = service.upsert(householdId, "2026-02", userId1, 0);
      expect(result?.revenueCents).toBe(0);
    });
  });

  describe("upsertBulk", () => {
    it("should upsert multiple contributions", () => {
      service.upsertBulk(householdId, "2026-02", [
        { userId: userId1, revenueCents: 420000 },
        { userId: userId2, revenueCents: 229000 },
      ]);

      const members = service.getByMonth(householdId, "2026-02");
      expect(members.find((m) => m.userId === userId1)?.revenueCents).toBe(
        420000,
      );
      expect(members.find((m) => m.userId === userId2)?.revenueCents).toBe(
        229000,
      );
    });
  });
});
