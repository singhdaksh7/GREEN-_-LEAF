import { Prisma, BulkOrderStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';

export interface BulkOrderInquiryInput {
  fullName: string;
  email: string;
  mobile: string;
  pincode: string;
  company?: string;
  product?: string;
  requirement?: string;
  message?: string;
  quantity: number;
  targetPrice?: number;
  expectedPurchaseDate?: string;
}

export function createInquiry(input: BulkOrderInquiryInput) {
  return prisma.bulkOrderInquiry.create({
    data: {
      ...input,
      expectedPurchaseDate: input.expectedPurchaseDate ? new Date(input.expectedPurchaseDate) : null,
    },
  });
}

export function listAdminInquiries(status?: BulkOrderStatus) {
  const where: Prisma.BulkOrderInquiryWhereInput = status ? { status } : {};
  return prisma.bulkOrderInquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function updateAdminInquiryStatus(id: string, status: BulkOrderStatus) {
  const inquiry = await prisma.bulkOrderInquiry.update({ where: { id }, data: { status } }).catch(() => null);
  if (!inquiry) throw ApiError.notFound('Enquiry not found');
  return inquiry;
}
