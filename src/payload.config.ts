import { cmsEmail } from './security/cmsEmail'
// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { ContactInfo } from './collections/ContactInfo'
import { AffiliateId } from './collections/AffiliateId'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { s3Storage } from '@payloadcms/storage-s3'
import { Listings } from './collections/Listings'
import { GoogleAnalytics } from './collections/GoogleAnalytics'

import { SoldArchive } from './collections/LightDms/SoldArchive'
import { FormOutbox } from './collections/FormOutbox'
import { FormRateLimits } from './collections/FormRateLimits'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  email: cmsEmail,
  graphQL: { disable: true },
  onInit: async (payload) => {
    await payload.db.collections['form-rate-limits'].collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    )
  },
  routes: {
    admin: '/websiteadmin',
  },
  admin: {
    // meta: {
    //   titleSuffix: '- MWA Admin',
    //   description: "MWA Autos - Your reliable family-run used car dealer in Nottinghamshire.",
    //   icons: `${process.env.NEXT_PUBLIC}/logo.png`,
    //   openGraph: {
    //     title: "Admin - MWA Autos",
    //     description: "MWA Autos - Your reliable family-run used car dealer in Nottinghamshire.",
    //     siteName: "My Website",
    //     images: [{ url: `${process.env.NEXT_PUBLIC}/logo.png` }]
    //   }
    // },
    components: {
      graphics: {
        // Logo: '/components/payload/Logo/Logo',
        // Icon: '/components/payload/Icon/Icon',
      },
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/payload/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/payload/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  // db: postgresAdapter({
  //   pool: {
  //     connectionString: process.env.DATABASE_URI || '',
  //   },
  // }),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Listings,
    FormOutbox,
    FormRateLimits,
    SoldArchive,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [AffiliateId, ContactInfo, GoogleAnalytics],
  plugins: [
    ...plugins,
    // Use owned S3 when configured; local media is reserved for isolated/local verification.
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: {
              media: {
                prefix: 'media',
              },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
              },
              region: process.env.S3_REGION!,
              endpoint: process.env.S3_ENDPOINT!,
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user?.roles?.includes('admin')) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
