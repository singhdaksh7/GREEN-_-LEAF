import { Prisma, User } from '@prisma/client';
import { prisma } from '../config/db';

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export function incrementTokenVersion(id: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
}

export function updatePasswordAndBumpTokenVersion(id: string, passwordHash: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
}

export function setUserActive(id: string, isActive: boolean): Promise<User> {
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export interface ListUsersOptions {
  q?: string;
  page: number;
  limit: number;
}

export function updateUserName(id: string, name: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { name } });
}

export function findCustomerById(id: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { id, role: 'CUSTOMER' } });
}

export async function listCustomers(options: ListUsersOptions) {
  const where: Prisma.UserWhereInput = {
    role: 'CUSTOMER',
    ...(options.q ? { OR: [{ name: { contains: options.q } }, { email: { contains: options.q } }] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
}
