import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const ContactInfo: GlobalConfig = {
  slug: 'contactInfo',
  label: 'Contact Information',
  admin: {
    description: 'Manage phone numbers and social media links for the website',
  },
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'Contact Information',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'phoneNumbers',
      type: 'array',
      label: 'Phone Numbers',
      dbName: 'phone_numbers',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          required: true,
          admin: {
            placeholder: 'e.g., Main Office, Sales, Service',
          },
        },
        {
          name: 'number',
          type: 'text',
          label: 'Phone Number',
          required: true,
          admin: {
            placeholder: 'e.g., 0115 961 6060',
          },
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          label: 'Primary Number',
          defaultValue: false,
          admin: {
            description: 'Mark this as the main phone number',
          },
        },
      ],
      defaultValue: [
        {
          label: 'Main Office',
          number: '447942078614',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      label: 'WhatsApp Number',
      admin: {
        placeholder: 'e.g., 07777 777 777',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links',
      dbName: 'social_links',
      fields: [
        {
          name: 'platform',
          type: 'select',
          label: 'Platform',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'WhatsApp Business', value: 'whatsapp' },
            { label: 'Google Business', value: 'google' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'customPlatform',
          type: 'text',
          label: 'Custom Platform Name',
          admin: {
            condition: (data, siblingData) => siblingData?.platform === 'other',
            description: 'Enter the platform name when "Other" is selected',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Profile URL',
          required: true,
          admin: {
            placeholder: 'https://facebook.com/dealership',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Active',
          defaultValue: true,
          admin: {
            description: 'Uncheck to hide this social link from the website',
          },
        },
      ],
      defaultValue: [
        {
          platform: 'facebook',
          url: 'https://facebook.com/dealership',
          isActive: true,
        },
      ],
    },
    {
      name: 'emailAddresses',
      type: 'array',
      label: 'Email Addresses',
      dbName: 'email_addresses',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          required: true,
          admin: {
            placeholder: 'e.g., General Enquiries, Sales, Support',
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          admin: {
            placeholder: 'e.g., info@mydv.co.uk',
          },
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          label: 'Primary Email',
          defaultValue: false,
          admin: {
            description: 'Mark this as the main email address',
          },
        },
      ],
      defaultValue: [
        {
          label: 'General Enquiries',
          email: 'info@mydv.co.uk',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'businessAddress',
      type: 'group',
      label: 'Business Address',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Business Name',
          defaultValue: 'MYDV Autos',
        },
        {
          name: 'street',
          type: 'text',
          label: 'Street Address',
          defaultValue: 'Unit 1, Riverside Industrial Estate, Farndon Road',
        },
        {
          name: 'city',
          type: 'text',
          label: 'City',
          defaultValue: 'Nottingham',
        },
        {
          name: 'postcode',
          type: 'text',
          label: 'Postcode',
          defaultValue: 'NG2 1DU',
        },
        {
          name: 'country',
          type: 'text',
          label: 'Country',
          defaultValue: 'United Kingdom',
        },
      ],
    },
  ],
}
