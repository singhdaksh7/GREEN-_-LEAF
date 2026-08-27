import bcrypt from 'bcryptjs';
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { User } from '../../src/models/User';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';

const app = createApp();

beforeAll(async () => {
  await setupTestDb();
}, 120000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

const validUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Password@123',
};

describe('POST /api/auth/register', () => {
  it('creates a normalized customer account, hashes its password, and starts a session', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, email: '  Ada@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: validUser.name, email: validUser.email, role: 'CUSTOMER' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('accessToken='),
      expect.stringContaining('refreshToken='),
    ]));

    const user = await User.findOne({ email: validUser.email }).select('+passwordHash');
    expect(user?.name).toBe(validUser.name);
    expect(user?.passwordHash).not.toBe(validUser.password);
    expect(await bcrypt.compare(validUser.password, user!.passwordHash)).toBe(true);
  });

  it('rejects duplicate normalized emails with a friendly message', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send({ ...validUser, email: ' ADA@EXAMPLE.COM ' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with this email already exists');
  });

  it.each([
    [{ ...validUser, email: 'not-an-email' }],
    [{ ...validUser, password: 'short' }],
    [{ ...validUser, role: 'ADMIN' }],
  ])('rejects invalid or privilege-escalating registration payloads', async (payload) => {
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({ email: ' ADA@EXAMPLE.COM ', password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('uses the same generic message for a wrong password and an unknown email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'WrongPassword@1' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'unknown@example.com', password: validUser.password });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });
});

describe('authenticated auth endpoints', () => {
  it('returns a safe current user and logs out', async () => {
    const agent = request.agent(app);
    const registerRes = await agent.post('/api/auth/register').send(validUser);
    const token = registerRes.body.data.accessToken;
    const me = await agent.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data).toMatchObject({ name: validUser.name, email: validUser.email });
    expect(me.body.data.passwordHash).toBeUndefined();

    const logout = await agent.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('accessToken=;'),
      expect.stringContaining('refreshToken=;'),
    ]));
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
