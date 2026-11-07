module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  generateRobotsTxt: false,
  exclude: ['/admin*','/websiteadmin*','/api/*','/next/*'],
  additionalSitemaps: ['/pages-sitemap.xml','/posts-sitemap.xml','/vehicles-sitemap.xml'],
}
