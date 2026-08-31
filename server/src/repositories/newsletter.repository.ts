import { prisma } from '../config/db';

export async function subscribe(email: string) {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) {
      return prisma.newsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true } });
    }
    return existing;
  }

  return prisma.newsletterSubscriber.create({ data: { email } });
}
