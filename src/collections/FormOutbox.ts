import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
export const FormOutbox: CollectionConfig = {
  slug: 'form-outbox',
  admin: { group: 'Operations', useAsTitle: 'kind' },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: 'submissionId', type: 'text', required: true, unique: true, index: true },
    { name: 'payloadHash', type: 'text', required: true },
    { name: 'notificationId', type: 'text' },
    { name: 'leaseUntil', type: 'date', index: true },
    { name: 'leaseToken', type: 'text' },
    { name: 'lastError', type: 'text' },
    { name: 'deliveredAt', type: 'date' },
    { name: 'kind', type: 'select', required: true, options: ['enquiry', 'reservation'] },
    { name: 'submission', type: 'json', required: true },
    { name: 'emailDelivered', type: 'checkbox', defaultValue: false },
    { name: 'webhookDelivered', type: 'checkbox', defaultValue: false },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'nextAttemptAt', type: 'date', index: true },
  ],
  timestamps: true,
}
