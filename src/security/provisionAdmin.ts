import type { Payload } from 'payload'
export async function provisionAdmin(payload: Payload, email: string, password: string) {
  email = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12)
    throw new Error('Supply a valid admin email and a password of at least 12 characters')
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length) {
    if (!existing.docs[0].roles?.includes('admin'))
      throw new Error('Existing account is not an admin; refusing to change privileges')
    return { created: false }
  }
  const users = await payload.count({ collection: 'users', overrideAccess: true })
  if (users.totalDocs)
    throw new Error('Users already exist; add subsequent admins through the authenticated admin')
  await payload.create({
    collection: 'users',
    data: { email, password, roles: ['admin'] },
    overrideAccess: true,
  })
  return { created: true }
}
