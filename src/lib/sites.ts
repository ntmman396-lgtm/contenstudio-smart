/**
 * Multi-Site Configuration for Long Châu Content Studio.
 * Supports Nhà thuốc (Pharmacy) and Tiêm chủng (Vaccination Center).
 */

import type { SiteId, SiteConfig } from '@/types';

// ─── Site Configurations ────────────────────────────────────

export const SITE_CONFIGS: Record<SiteId, SiteConfig> = {
  'nha-thuoc': {
    id: 'nha-thuoc',
    name: 'Nhà thuốc Long Châu',
    icon: '🏥',
    description: 'Nội dung cho website nhà thuốc: thuốc, dược liệu, bệnh lý, TPCN, blog sức khỏe',
    strapiBaseUrl: process.env.STRAPI_URL_NHA_THUOC || process.env.NEXT_PUBLIC_STRAPI_URL || '',
    strapiApiToken: process.env.STRAPI_TOKEN_NHA_THUOC || process.env.NEXT_PUBLIC_STRAPI_TOKEN || '',
    defaultCategory: 'Sức khỏe',
  },
  'tiem-chung': {
    id: 'tiem-chung',
    name: 'Tiêm chủng Long Châu',
    icon: '💉',
    description: 'Nội dung cho website tiêm chủng: vắc xin, bệnh lý, blog phòng bệnh, hỏi đáp',
    strapiBaseUrl: process.env.STRAPI_URL_TIEM_CHUNG || '',
    strapiApiToken: process.env.STRAPI_TOKEN_TIEM_CHUNG || '',
    defaultCategory: 'Tiêm chủng',
  },
};

// ─── Helpers ────────────────────────────────────────────────

export const ALL_SITES: SiteId[] = ['nha-thuoc', 'tiem-chung'];

export function getSiteConfig(siteId: SiteId): SiteConfig {
  return SITE_CONFIGS[siteId];
}

export function getSiteName(siteId: SiteId): string {
  return SITE_CONFIGS[siteId]?.name || siteId;
}

export const DEFAULT_SITE: SiteId = 'nha-thuoc';
