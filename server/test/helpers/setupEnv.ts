// Runs before any test file's own imports, so it must set DATABASE_URL
// before `src/config/db.ts` (which binds PrismaClient to
// process.env.DATABASE_URL at construction time) is ever imported —
// otherwise tests would silently run against the dev database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'mysql://root:root@localhost:3306/greenkart_test';
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
