import { IdempotencyRepo } from "@/server/repositories/idempotency.repo";

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<{ result: T; fromCache: boolean }> {
  const cached = await IdempotencyRepo.find(key);
  if (cached) return { result: cached.response as T, fromCache: true };

  const result = await fn();
  await IdempotencyRepo.save(key, result);
  return { result, fromCache: false };
}
