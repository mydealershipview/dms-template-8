import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Resend } from 'resend'
import type { FormOutbox } from '@/payload-types'
import { deliverDmsLead } from '@/utilities/dmsLead'
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
/** Atomic expiring lease across processes. Successful channels are saved individually. */
export async function deliverSubmission(entry: FormOutbox) {
  const payload = await getPayload({ config })
  const model = payload.db.collections['form-outbox']
  const leaseToken = randomUUID()
  const claimed = (await model.findOneAndUpdate(
    {
      _id: entry.id,
      $or: [
        { leaseUntil: { $exists: false } },
        { leaseUntil: null },
        { leaseUntil: { $lt: new Date() } },
      ],
    },
    { $set: { leaseToken, leaseUntil: new Date(Date.now() + 120000) } },
    { new: true, lean: true },
  )) as unknown as FormOutbox | null
  if (!claimed)
    return {
      dmsDelivered: entry.webhookDelivered === true,
      emailDelivered: entry.emailDelivered === true,
    }
  let dmsDelivered = claimed.webhookDelivered === true,
    emailDelivered = claimed.emailDelivered === true
  const save = (data: Record<string, unknown>) =>
    model.updateOne({ _id: entry.id, leaseToken }, { $set: data })
  try {
    if (!dmsDelivered) {
      try {
        const ack = await deliverDmsLead(
          claimed.submission as Record<string, unknown>,
          claimed.submissionId,
        )
        await save({ webhookDelivered: true, notificationId: ack.notificationId })
        dmsDelivered = true
      } catch {
        console.error('DMS lead delivery pending; retained for retry')
      }
    }
    if (!emailDelivered) {
      try {
        if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.EMAIL_TO)
          throw new Error('Email not configured')
        // Sensitive finance/bank details remain in the private DMS/outbox, never in email.
        const personal = (claimed.submission as Record<string, unknown>).personal as Record<
          string,
          unknown
        >
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
          {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_TO.split(',')
              .map((v) => v.trim())
              .filter(Boolean),
            subject:
              claimed.kind === 'reservation' ? 'Vehicle reservation enquiry' : 'Website enquiry',
            html: `<p>A website enquiry from ${escapeHtml(String(personal.firstName || 'a customer'))} is ${dmsDelivered ? 'available in DMS' : 'awaiting DMS delivery'}. Open the private operations outbox to review it.</p>`,
          },
          { idempotencyKey: `website-form-${claimed.submissionId}` },
        )
        if (result.error) throw new Error('Email refused')
        await save({ emailDelivered: true })
        emailDelivered = true
      } catch {
        console.error('Form email delivery pending; retained for retry')
      }
    }
    await save({
      attempts: (claimed.attempts || 0) + 1,
      nextAttemptAt: new Date(
        Date.now() + Math.min(1440, 2 ** Math.min(claimed.attempts || 0, 10)) * 60000,
      ),
      deliveredAt: dmsDelivered && emailDelivered ? new Date() : null,
      lastError:
        dmsDelivered && emailDelivered
          ? null
          : 'Delivery pending. Check server configuration and retry.',
      leaseUntil: null,
      leaseToken: null,
    })
    return { dmsDelivered, emailDelivered }
  } catch (error) {
    await save({ leaseUntil: null, leaseToken: null })
    throw error
  }
}
