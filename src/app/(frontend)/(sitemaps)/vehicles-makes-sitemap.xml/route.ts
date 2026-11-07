import { getServerSideSitemap } from 'next-sitemap'
import { getMakesModels } from '@/lib/services/publicListings'
import { getServerSideURL } from '@/utilities/getURL'
export const dynamic='force-dynamic'
export async function GET(){const {makes}=await getMakesModels();return getServerSideSitemap(makes.map(make=>({loc:`${getServerSideURL()}/used-cars?make=${encodeURIComponent(make.name)}`})))}
