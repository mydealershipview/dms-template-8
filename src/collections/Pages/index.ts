import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { terms } from './templates/terms'
import { promotions } from './templates/promotions'
import { privacy } from './templates/privacy'
import { cookies } from './templates/cookies'
import { reviews } from './templates/reviews'
import { listingsTemplate } from './templates/listings'
import { vacancies } from './templates/vacancies'
import { homepage } from './templates/homepage'
import { warranty } from './templates/warranty'
import { finance } from './templates/finance'
import { isAdmin, isAdminFieldLevel } from '@/access/isAdmin'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: authenticatedOrPublished,
    update: isAdmin,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'pages',
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'template',
      type: 'select',
      required: true,
      defaultValue: 'default',
      options: [
        {
          label: 'Default Page',
          value: 'default',
        },
        {
          label: 'Terms & Conditions',
          value: 'terms',
        },
        {
          label: 'Promotions',
          value: 'promotions',
        },
        {
          label: 'Privacy Policy',
          value: 'privacy',
        },
        {
          label: 'Cookie Policy',
          value: 'cookies',
        },
        {
          label: 'Reviews',
          value: 'reviews',
        },
        {
          label: 'Used Cars Listings',
          value: 'listings',
        },
        {
          label: 'Vacancies',
          value: 'vacancies',
        },
        {
          label: 'Homepage',
          value: 'homepage',
        },
        {
          label: 'Warranty',
          value: 'warranty',
        },
        {
          label: 'Finance',
          value: 'finance',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    // Terms Template Fields
    {
      name: 'termsContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'terms',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...terms]
    },
    // Promotions Template Fields
    {
      name: 'promotionsContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'promotions',
      },
      fields: [...promotions],
    },
    // Privacy Template Fields
    {
      name: 'privacyContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'privacy',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...privacy],
    },
    // Cookies Template Fields
    {
      name: 'cookiesContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'cookies',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...cookies],
    },
    // Reviews Template Fields
    {
      name: 'reviewsContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'reviews',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...reviews],
    },
    // Listings Template Fields
    {
      name: 'listingsContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'listings',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...listingsTemplate],
    },
    // Vacancies Template Fields
    {
      name: 'vacanciesContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'vacancies',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...vacancies],
    },
    // Homepage Template Fields
    {
      name: 'content',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'homepage',
      },
      fields: [...homepage],
    },
    // Warranty Template Fields
    {
      name: 'warrantyContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'warranty',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...warranty],
    },
    // Finance Template Fields
    {
      name: 'financeContent',
      type: 'group',
      admin: {
        condition: (data) => data?.template === 'finance',
      },
      access: {
        update: isAdminFieldLevel,
      },
      fields: [...finance],
    },
    {
      type: 'tabs',
      admin: {
        condition: (data) => data?.template === 'default',
      },
      tabs: [
        // {
        //   fields: [hero],
        //   label: 'Hero',
        // },
        // {
        //   fields: [
        //     {
        //       name: 'layout',
        //       type: 'blocks',
        //       blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
        //       required: true,
        //       admin: {
        //         initCollapsed: true,
        //       },
        //     },
        //   ],
        //   label: 'Content',
        // },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
