import { isAdmin } from '@/access/isAdmin'
import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const AffiliateId: GlobalConfig = {
  slug: 'affiliateId',
  label: 'Affiliate IDs',
  admin: {
    description: 'Manage dealer affiliate IDs for the website',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'affiliateIds',
      type: 'array',
      fields: [
        {
          name: 'dealerAffiliateId',
          type: 'text',
          label: 'Dealer Affiliate ID',
          required: true,
          unique: true,
          admin: {
            placeholder: 'e.g., 43697',
            description: 'Enter the dealer affiliate ID',
          },
          validate: (value: string | null | undefined) => {
            if (!value) return 'Dealer Affiliate ID is required'
            if (!/^\d+$/.test(value)) return 'Dealer Affiliate ID must contain only numbers'
            return true
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Active',
          defaultValue: true,
          admin: {
            description: 'Set this affiliate ID as active/inactive',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          admin: {
            placeholder: 'Optional description for this affiliate ID',
            description: 'Add a note about when or where this affiliate ID is used',
          },
        },
      ]
    }
  ],
}
