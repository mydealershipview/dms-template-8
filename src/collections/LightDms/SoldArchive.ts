import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

/**
 * The Sold Cars page (Light DMS spec 4): a snapshot of a car, taken by the website when it is
 * marked Sold and the user chose to keep it on the page. Public fields only, never a VIN. Kept
 * whatever happens to the car in the DMS afterwards.
 */
export const SoldArchive: CollectionConfig = {
  slug: 'sold-archive',
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'registration', 'price', 'soldDate'],
    group: 'Light DMS',
  },
  defaultSort: '-soldDate',
  fields: [
    { name: 'archiveRevision', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'visible', type: 'checkbox', defaultValue: true },
    { name: 'removed', type: 'checkbox', defaultValue: false },
    { name: 'copyWarning', type: 'text' },
    { name: 'cleanupNotifiedAt', type: 'date' },
    { name: 'pendingSince', type: 'date', index: true, admin: { readOnly: true } },
    { name: 'history', type: 'json', admin: { readOnly: true } },
    { name: 'sourceImages', type: 'json', admin: { readOnly: true, hidden: true } },
    { name: 'confirmed', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    { name: 'stockId', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'registration', type: 'text' },
    { name: 'make', type: 'text' },
    { name: 'model', type: 'text' },
    { name: 'derivative', type: 'text' },
    { name: 'year', type: 'number' },
    { name: 'mileage', type: 'number' },
    { name: 'fuelType', type: 'text' },
    { name: 'transmissionType', type: 'text' },
    { name: 'bodyType', type: 'text' },
    { name: 'colour', type: 'text' },
    { name: 'price', type: 'number' },
    { name: 'vatStatus', type: 'text' },
    { name: 'highlight', type: 'text' },
    { name: 'description', type: 'textarea' },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'mediaId', type: 'text' },
      ],
    },
    { name: 'soldDate', type: 'date', required: true, index: true },
    { name: 'archivedBy', type: 'text', admin: { readOnly: true } },
  ],
  timestamps: true,
}
