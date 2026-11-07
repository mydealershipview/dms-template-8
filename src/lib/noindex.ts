/** A deployment is non-indexable when either SEO_NOINDEX or SITE_NOINDEX is "true". */
export function siteNoindex(env: Record<string, string | undefined> = process.env): boolean {
  return env.SEO_NOINDEX === 'true' || env.SITE_NOINDEX === 'true'
}
