import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import { siteNoindex } from '@/lib/noindex'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow:
        siteNoindex() ? '/' : ['/admin', '/websiteadmin', '/api/', '/next/'],
    },
    sitemap: [
      `${getServerSideURL()}/pages-sitemap.xml`,
      `${getServerSideURL()}/posts-sitemap.xml`,
      `${getServerSideURL()}/vehicles-sitemap.xml`,
    ],
  }
}
