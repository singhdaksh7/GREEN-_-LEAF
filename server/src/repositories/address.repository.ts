import { Address, Prisma } from '@prisma/client';
import { prisma } from '../config/db';

export function listAddressesForUser(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(userId: string, data: Omit<Prisma.AddressCreateInput, 'user'>): Promise<Address> {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...data, user: { connect: { id: userId } } } });
}

export async function updateAddress(
  id: string,
  userId: string,
  data: Partial<Omit<Prisma.AddressUpdateInput, 'user'>>
): Promise<Address | null> {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const result = await prisma.address.updateMany({ where: { id, userId }, data });
  if (result.count === 0) return null;
  return prisma.address.findUnique({ where: { id } });
}

export async function deleteAddress(id: string, userId: string): Promise<boolean> {
  const result = await prisma.address.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
