import { getPayload } from 'payload'
import config from '../src/payload.config'
import { provisionAdmin } from '../src/security/provisionAdmin'
const email = process.env.PROVISION_ADMIN_EMAIL
const password = process.env.PROVISION_ADMIN_PASSWORD
if (!email || !password) throw new Error('Set PROVISION_ADMIN_EMAIL and PROVISION_ADMIN_PASSWORD')
const payload = await getPayload({ config })
try {
  const result = await provisionAdmin(payload, email, password)
  console.info(result.created ? 'First admin provisioned' : 'Admin already provisioned; unchanged')
} finally {
  await payload.destroy()
}
