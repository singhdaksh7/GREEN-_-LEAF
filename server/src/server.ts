import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Green Leaf API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
