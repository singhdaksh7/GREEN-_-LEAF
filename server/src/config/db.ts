import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  // eslint-disable-next-line no-console
  console.log(`[db] connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`);
}
