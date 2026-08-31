import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

const SETTINGS_KEY = 'default';

export function getSettings() {
  return prisma.siteSettings.upsert({
    where: { key: SETTINGS_KEY },
    update: {},
    create: { key: SETTINGS_KEY },
  });
}

export interface SettingsInput {
  announcementText?: string;
  freeShippingThreshold?: number;
  standardShippingFee?: number;
  whatsappNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  workingHours?: string;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialYoutube?: string | null;
  socialLinkedin?: string | null;
}

export function updateSettings(input: SettingsInput) {
  const data: Prisma.SiteSettingsUpdateInput = { ...input };
  return prisma.siteSettings.upsert({
    where: { key: SETTINGS_KEY },
    update: data,
    create: { key: SETTINGS_KEY, ...input },
  });
}
