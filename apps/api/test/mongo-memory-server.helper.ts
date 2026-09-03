import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function startMongoMemoryServer(): Promise<string> {
  mongod = await MongoMemoryServer.create();
  return mongod.getUri();
}

export async function stopMongoMemoryServer(): Promise<void> {
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
