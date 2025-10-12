import { ClientSession } from 'mongoose';

/**
 * Generic helper to run an async function inside a repository transaction.
 * If a session is provided, it will be used (caller manages commit/abort).
 * Otherwise the helper will start/commit/abort the transaction via the repo methods.
 */
export async function runInTransaction<T extends { startTransaction: () => Promise<ClientSession>; commitTransaction: (s: ClientSession) => Promise<void>; abortTransaction: (s: ClientSession) => Promise<void>; }, R>(
  repo: T,
  fn: (session: ClientSession) => Promise<R>,
  session?: ClientSession,
): Promise<R> {
  if (session) {
    // caller provided session; just execute
    return fn(session);
  }

  const s = await repo.startTransaction();
  try {
    const result = await fn(s);
    await repo.commitTransaction(s);
    return result;
  } catch (err) {
    try {
      await repo.abortTransaction(s);
    } catch (abortErr) {
      // best-effort abort; log to console for now
      console.error('Failed to abort transaction', { message: (abortErr as Error).message });
    }
    throw err;
  }
}
