'use client'

import FormProtection,{submitProtectedForm} from '@/forms/FormProtection'
import React, { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import type { WebhookData } from '@/types/webhook'

interface FormState {
  registration: string
  makeModel: string
  mileage: string
  fullName: string
  email: string
  phone: string
  preferredDate: string
  preferredTime: string
  furtherDetails: string
}

const initialState: FormState = {
  registration: '',
  makeModel: '',
  mileage: '',
  fullName: '',
  email: '',
  phone: '',
  preferredDate: '',
  preferredTime: '',
  furtherDetails: '',
}

const inputClass =
  'w-full bg-transparent border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-sm'

const labelClass = 'block text-xs font-semibold tracking-widest text-white/70 uppercase mb-2'

export default function ServiceBookingForm() {
  const [formData, setFormData] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
    const trimmed = fullName.trim()
    if (!trimmed) {
      return { firstName: '', lastName: '' }
    }

    const parts = trimmed.split(/\s+/)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ')

    return { firstName, lastName }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { firstName, lastName } = splitFullName(formData.fullName)

      const payload: WebhookData = {
        advertiserId: '',
        enquiryType: 'book-appointment',
        personal: {
          title: null,
          firstName,
          lastName,
          email: formData.email,
          phoneNumber: formData.phone,
          gender: null,
          countryOfOrigin: null,
          dateOfBirth: null,
          maritalStatus: null,
          dependents: null,
          address: null,
        },
        vehicle: null,
        userVehicle: {make:formData.makeModel || null,model:null,registration:formData.registration || null,mileage:formData.mileage || null,year:null,recentValuations:null},
        findYourNextCar: null,
        testDrive: {
          isTestDrive: false,
          testDriveDate: formData.preferredDate || null,
          testDriveTime: formData.preferredTime || null,
          additionalRequirements: formData.furtherDetails || null,
        },
        employment: null,
        finance: null,
        bank: null,
        notes: [
          'Service booking request submitted from services page.',
          formData.makeModel ? `Make/Model: ${formData.makeModel}` : '',
          formData.preferredDate ? `Preferred Date: ${formData.preferredDate}` : '',
          formData.preferredTime ? `Preferred Time: ${formData.preferredTime}` : '',
          formData.furtherDetails ? `Further Details: ${formData.furtherDetails}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      }

      const res = await submitProtectedForm('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, e.currentTarget as HTMLFormElement)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to submit. Please try again.')
      }

      setSubmitted(true)
      setFormData(initialState)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-black tracking-wider text-white uppercase mb-2">
          Booking Request Sent!
        </h3>
        <p className="text-white/60 max-w-md mx-auto">
          Thank you for your booking request. A member of our team will be in touch with you
          shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-red-500 hover:text-red-400 text-sm font-semibold tracking-wider uppercase underline"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Vehicle Details ── */}
      <div>
        <h3 className="text-sm font-black tracking-widest uppercase text-white mb-1">
          Vehicle Details
        </h3>
        <div className="h-[2px] w-full bg-red-600 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="registration" className={labelClass}>
              Vehicle Reg <span className="text-red-500">*</span>
            </label>
            <input
              id="registration"
              name="registration"
              type="text"
              required
              value={formData.registration}
              onChange={handleChange}
              placeholder="VRM"
              className={`${inputClass} bg-yellow-400 text-black placeholder-black/50 border-yellow-400 focus:border-yellow-300`}
            />
          </div>

          <div>
            <label htmlFor="makeModel" className={labelClass}>
              Make &amp; Model
            </label>
            <input
              id="makeModel"
              name="makeModel"
              type="text"
              value={formData.makeModel}
              onChange={handleChange}
              placeholder="Make &amp; Model"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="mileage" className={labelClass}>
              Mileage <span className="text-red-500">*</span>
            </label>
            <input
              id="mileage"
              name="mileage"
              type="text"
              required
              value={formData.mileage}
              onChange={handleChange}
              placeholder="Mileage"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Personal Details ── */}
      <div>
        <h3 className="text-sm font-black tracking-widest uppercase text-white mb-1">
          Personal Details
        </h3>
        <div className="h-[2px] w-full bg-red-600 mb-6" />

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Request ── */}
      <div>
        <h3 className="text-sm font-black tracking-widest uppercase text-white mb-1">
          Booking Request
        </h3>
        <div className="h-[2px] w-full bg-red-600 mb-6" />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className={labelClass}>
                Preferred Date <span className="text-red-500">*</span>
              </label>
              <input
                id="preferredDate"
                name="preferredDate"
                type="date"
                required
                value={formData.preferredDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="preferredTime" className={labelClass}>
                Preferred Time
              </label>
              <input
                id="preferredTime"
                name="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="furtherDetails" className={labelClass}>
              Any Further Details?
            </label>
            <textarea
              id="furtherDetails"
              name="furtherDetails"
              rows={5}
              value={formData.furtherDetails}
              onChange={handleChange}
              placeholder="Let us know more about your vehicle, do you require this urgently?"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      <FormProtection />
      {error && (
        <p role="status" aria-live="polite" className="text-red-400 text-sm text-center border border-red-500/30 px-4 py-3">
          {error}
        </p>
      )}

      <p className="text-white/40 text-xs">* required fields</p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black tracking-widest uppercase px-10 py-3 transition-colors text-sm"
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
