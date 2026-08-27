import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * Integration tests run entirely against an in-memory MongoDB instance
 * spun up per test file. This never touches the real MONGODB_URI (Atlas
 * in production/dev), and `config/env.ts` is never consulted for the
 * connection string here.
 *
 * A single-node replica set (not a plain standalone MongoMemoryServer) is
 * required because order creation uses a real multi-document transaction
 * (`session.withTransaction`), and MongoDB only supports transactions on
 * replica sets.
 */
let mongod: MongoMemoryReplSet | null = null;

export async function setupTestDb(): Promise<void> {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongod.getUri());
}

export async function teardownTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
