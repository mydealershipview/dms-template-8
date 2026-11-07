import FormProtection from '@/forms/FormProtection'
import EnquiryDialog from '@/components/vehicle/EnquiryDialog'
import React, { useState } from 'react'
import { Mail } from 'lucide-react'
import { buildBaseWebhookPayload, submitWebhookForm, withInterestedVehicle } from './formSubmission'

interface EmailModalProps {
  emailAddress: string
  vehicleMake: string
  vehicleModel: string
  vehicleReg: string
  vehiclePrice: number | null
  stockId?: string
  onClose: () => void
}

export default function EmailModal({
  emailAddress,
  vehicleMake,
  vehicleModel,
  vehicleReg,
  vehiclePrice,
  stockId,
  onClose,
}: EmailModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const basePayload = buildBaseWebhookPayload({
        enquiryType: 'find-your-next-car',
        firstName,
        lastName,
        email,
        phoneNumber: phone,
      })

      const payload = withInterestedVehicle(basePayload, {
        stockId,
        make: vehicleMake,
        model: vehicleModel,
        registration: vehicleReg,
        price: vehiclePrice,
      })

      payload.findYourNextCar = {
        enquiryType: 'stock-vehicle',
        vehiclePreferences: `${vehicleMake} ${vehicleModel}`,
      }

      payload.notes = 'Customer opened an email enquiry from vehicle detail page.'

      await submitWebhookForm(payload, e.currentTarget)

    const subject = encodeURIComponent(`Enquiry: ${vehicleMake} ${vehicleModel} (${vehicleReg || 'No Reg'})`)
    const body = encodeURIComponent(`Hi,\n\nI am interested in the ${vehicleMake} ${vehicleModel} (${vehicleReg || 'No Reg'}) and would like to get more information.\n\nPlease contact me via email or phone.\n\nThanks.`)
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`
    onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit email enquiry')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EnquiryDialog label="Vehicle email enquiry" onClose={onClose}>
      <div className="w-full max-w-sm bg-[#161616] border border-white/10 p-6 shadow-2xl text-center">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-5 h-5 text-white" />
        </div>
        
        <h2 className="text-xl font-light tracking-widest uppercase mb-2">Email Dealership</h2>
        <p className="text-sm text-zinc-400 mb-8">
          Send us an email regarding the {vehicleMake} {vehicleModel}.
        </p>

        <form onSubmit={handleEmail}>
        <div className="space-y-3 text-left mb-6">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            type="text"
            required
            aria-label="First Name" placeholder="First Name"
            className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            type="text"
            required
            aria-label="Last Name" placeholder="Last Name"
            className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            aria-label="Email" placeholder="Email"
            className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            required
            aria-label="Phone" placeholder="Phone"
            className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="text-lg font-medium tracking-widest mb-8 text-zinc-300">
          {emailAddress}
        </div>

        {submitError && <p role="status" aria-live="polite" className="text-sm text-red-400 mb-4">{submitError}</p>}

        <FormProtection />
        <div className="flex gap-4">
          <button type="button"
            onClick={onClose}
            className="flex-1 border border-white/30 text-white px-4 py-4 text-xs font-semibold tracking-widest uppercase hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={isSubmitting || !firstName || !lastName || !email || !phone}
            type="submit"
            className="flex-1 bg-white text-black px-4 py-4 text-xs font-semibold tracking-widest uppercase hover:bg-zinc-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Open Mail'}
          </button>
        </div>
        </form>
      </div>
    </EnquiryDialog>
  )
}
