import type { CollectionConfig } from 'payload'
export const FormRateLimits: CollectionConfig = {
  slug: 'form-rate-limits',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'key', type: 'text', unique: true, required: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}
