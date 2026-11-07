import { isAdmin } from '@/access/isAdmin'
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
    update: isAdmin,
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
            placeholder: 'https://facebook.com/mwaautosltd',
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
          url: 'https://facebook.com/mwaautosltd',
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
            placeholder: 'e.g., support@mydealershipview.com',
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
          email: 'support@mydealershipview.com',
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
          defaultValue: 'MWA Autos',
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
        {
          name: 'googleMapsUrl',
          type: 'text',
          label: 'Google Maps Embed URL',
          defaultValue: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d18865863.00352503!2d-40.63400479999996!3d54.74547460000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487e80cc63163293%3A0x6887f01b1b8b853f!2sAutopark%20UK%20Car%20Dealer%20In%20Durham!5e0!3m2!1sen!2s!4v1756149439828!5m2!1sen!2s',
          admin: {
            placeholder: 'https://www.google.com/maps/embed?pb=...',
            description: 'Embed URL from Google Maps for the location iframe',
          },
        },
      ],
    },
    {
      name: 'openingHours',
      type: 'array',
      label: 'Opening Hours',
      dbName: 'opening_hours',
      fields: [
        {
          name: 'day',
          type: 'select',
          label: 'Day',
          required: true,
          options: [
            { label: 'Monday', value: 'Monday' },
            { label: 'Tuesday', value: 'Tuesday' },
            { label: 'Wednesday', value: 'Wednesday' },
            { label: 'Thursday', value: 'Thursday' },
            { label: 'Friday', value: 'Friday' },
            { label: 'Saturday', value: 'Saturday' },
            { label: 'Sunday', value: 'Sunday' },
          ],
        },
        {
          name: 'hours',
          type: 'text',
          label: 'Hours',
          required: true,
          admin: {
            placeholder: 'e.g., 10:00 - 18:00 or Closed',
          },
        },
        {
          name: 'isClosed',
          type: 'checkbox',
          label: 'Closed',
          defaultValue: false,
          admin: {
            description: 'Check if closed on this day',
          },
        },
      ],
      defaultValue: [
        { day: 'Monday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Tuesday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Wednesday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Thursday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Friday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Saturday', hours: '10:00 - 18:00', isClosed: false },
        { day: 'Sunday', hours: '10:00 - 15:00', isClosed: false },
      ],
    },
    {
      name: 'companyInfo',
      type: 'group',
      label: 'Company Information',
      fields: [
        {
          name: 'displayName',
          type: 'text',
          label: 'Display Name',
          defaultValue: 'Premium Auto Dealers',
          admin: {
            description: 'Company name as shown on the website',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          admin: {
            placeholder: 'e.g., Excellence in Motion',
          },
        },
        {
          name: 'fcaNumber',
          type: 'text',
          label: 'FCA Number',
          admin: {
            placeholder: 'e.g., 912345',
            description: 'Financial Conduct Authority registration number',
          },
        },
        {
          name: 'disclaimer',
          type: 'textarea',
          label: 'Legal Disclaimer',
          defaultValue: 'Premium Auto Dealers are a credit broker and not a lender. We are Authorised and Regulated by the Financial Conduct Authority. FCA No: 912345. Permitted activities include acting as a credit broker, not a lender. We can introduce you to a limited number of finance providers and may receive differing commission levels from each of them for the introduction. All finance applications are subject to status, terms, and conditions apply. UK Residents only, 18s or over guarantees may be required.',
          admin: {
            description: 'Legal disclaimer text displayed in the footer',
          },
        },
      ],
    },
    {
      name: 'footerLinks',
      type: 'group',
      label: 'Footer Links',
      fields: [
        {
          name: 'termsUrl',
          type: 'text',
          label: 'Terms & Conditions URL',
          defaultValue: '/terms',
        },
        {
          name: 'privacyUrl',
          type: 'text',
          label: 'Privacy Policy URL',
          defaultValue: '/privacy',
        },
        {
          name: 'cookiesUrl',
          type: 'text',
          label: 'Cookies Policy URL',
          defaultValue: '/cookies',
        },
        {
          name: 'poweredByText',
          type: 'text',
          label: 'Powered By Text',
          defaultValue: 'MYDEALERSHIPVIEW',
        },
        {
          name: 'poweredByUrl',
          type: 'text',
          label: 'Powered By URL',
          admin: {
            placeholder: 'https://mydealershipview.com',
          },
        },
      ],
    },
  ],
}
