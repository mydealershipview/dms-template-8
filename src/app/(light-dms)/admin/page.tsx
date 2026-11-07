import { redirect } from 'next/navigation'
import { getSessionToken } from '@/lightdms/session'
import Workspace from '@/lightdms/Workspace'
export default async function Admin() {
  if (!(await getSessionToken())) redirect('/admin/login')
  return <Workspace />
}
