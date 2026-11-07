import { adminRoute, noStoreJson } from '@/lightdms/adminRequest'
import { clearSession } from '@/lightdms/session'
import { dmsJson } from '@/lightdms/dms'
export const POST = adminRoute(async (_request, session) => {
  await dmsJson('/api/website-admin/logout', { method: 'POST', session })
  await clearSession()
  return noStoreJson({ success: true })
})
