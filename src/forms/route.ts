import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { FormError, validatedSubmission, resolveSubmissionStock } from './security'
import { deliverSubmission } from './delivery'
import { leadConfig } from '@/lib/services/dmsConfig'
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
export const formRoute = (kind: 'enquiry' | 'reservation') => async (request: Request) => {
  try {
    leadConfig() // Refuse broken routing before either delivery channel.
    const { submissionId, ...submission } = await validatedSubmission(request, kind)
    const payload = await getPayload({ config })
    const payloadHash = createHash('sha256').update(JSON.stringify(submission)).digest('hex')
    let entry = (
      await payload.find({
        collection: 'form-outbox',
        where: { submissionId: { equals: submissionId } },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0]
    if (!entry) {
      try {
        entry = await payload.create({
          collection: 'form-outbox',
          overrideAccess: true,
          data: { kind, submission: await resolveSubmissionStock(submission,kind), submissionId, payloadHash },
        })
      } catch (error) {
        entry = (
          await payload.find({
            collection: 'form-outbox',
            where: { submissionId: { equals: submissionId } },
            limit: 1,
            overrideAccess: true,
          })
        ).docs[0]
        if (!entry) throw error
      }
    }
    if (entry.payloadHash !== payloadHash || entry.kind !== kind)
      throw new FormError('This submission identity was already used. Start a new enquiry.', 409)
    const delivered = await deliverSubmission(entry)
    return json(
      {
        success: delivered.dmsDelivered,
        pending: !delivered.dmsDelivered,
        message: delivered.dmsDelivered
          ? 'Your enquiry has been sent to the dealership.'
          : 'Your enquiry is safely recorded; DMS delivery is pending. Please retry with the same details.',
        ...(!delivered.emailDelivered ? { warning: 'Email notification is pending.' } : {}),
      },
      delivered.dmsDelivered ? 200 : 202,
    )
  } catch (error) {
    if (error instanceof FormError) {
      const response = json({ success: false, error: error.message }, error.status)
      if (error.status === 429) response.headers.set('Retry-After', '900')
      return response
    }
    console.error('Form could not be recorded or delivered')
    return json(
      {
        success: false,
        error: 'We could not confirm your enquiry. Please retry or contact the dealership.',
      },
      503,
    )
  }
}
