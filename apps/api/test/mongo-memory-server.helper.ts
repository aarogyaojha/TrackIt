import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | null = null;

export async function startMongoMemoryServer(): Promise<string> {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  return replSet.getUri();
}

export async function stopMongoMemoryServer(): Promise<void> {
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}
