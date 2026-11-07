import { MongoMemoryServer } from 'mongodb-memory-server'
export default async function setup() {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'template2-test-fixtures' } })
  process.env.DATABASE_URI = mongo.getUri()
  process.env.PAYLOAD_SECRET = 'isolated-test-secret-at-least-32-characters'
  process.env.S3_BUCKET = ''
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://dealer.test'
  return () => mongo.stop()
}
