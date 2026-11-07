'use client'

import FormProtection,{submitProtectedForm} from '@/forms/FormProtection'
import React, { useState } from 'react'
import { Send } from 'lucide-react'
import type { WebhookData } from '@/types/webhook'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { firstName, lastName } = splitFullName(formData.fullName)

      const payload: WebhookData = {
        advertiserId: '',
        enquiryType: 'general-contact',
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
        userVehicle: null,
        findYourNextCar: {
          enquiryType: 'general-enquiry',
          vehiclePreferences: null,
        },
        testDrive: null,
        employment: null,
        finance: null,
        bank: null,
        notes: formData.message || 'General contact enquiry submitted from contact page.',
      }

      const res = await submitProtectedForm('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, e.currentTarget as HTMLFormElement)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to send message. Please try again.')
      }

      setSubmitted(true)
      setFormData({ fullName: '', email: '', phone: '', message: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-black tracking-wider text-white uppercase mb-2">Message Sent!</h3>
        <p className="text-white/60">Thank you for getting in touch. We&apos;ll get back to you shortly.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-red-500 hover:text-red-400 text-sm font-semibold tracking-wider uppercase underline"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold tracking-wider text-white/80 uppercase mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full bg-transparent border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
          placeholder=""
        />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold tracking-wider text-white/80 uppercase mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-transparent border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
            placeholder=""
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold tracking-wider text-white/80 uppercase mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full bg-transparent border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
            placeholder=""
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold tracking-wider text-white/80 uppercase mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full bg-transparent border border-white/20 text-white placeholder-white/30 px-4 py-3 focus:outline-none focus:border-red-500 transition-colors resize-none"
          placeholder="Please enter a message here"
        />
      </div>

      <FormProtection />
      {error && (
        <p role="status" aria-live="polite" className="text-red-400 text-sm font-semibold">{error}</p>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <p className="text-white/40 text-xs">
          * required fields
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black tracking-widest uppercase px-10 py-3 transition-colors text-sm"
        >
          {isSubmitting ? 'Sending...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
