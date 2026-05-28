import { db } from "@/server/db/client";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const IdempotencyRepo = {
  async find(key: string): Promise<{ response: unknown } | null> {
    const record = await db.idempotencyRecord.findUnique({ where: { key } });

    // Treat expired records the same as missing ones.
    if (!record || record.expiresAt < new Date()) return null;

    return { response: JSON.parse(record.response) };
  },

  async save(key: string, response: unknown): Promise<void> {
    await db.idempotencyRecord.create({
      data: {
        key,
        response: JSON.stringify(response),
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
  },
};
