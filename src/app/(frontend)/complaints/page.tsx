import React from 'react'
import type { Metadata } from 'next'
import { getDealershipInfo } from '@/lib/services/dealership.service'

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipInfo()

  return {
    title: `Complaints Policy | ${dealership.name}`,
    description: `View the complaints handling procedure and policy for ${dealership.name}.`,
  }
}

export default async function ComplaintsPage() {
  const dealership = await getDealershipInfo()
  const postalAddress = [dealership.address?.line1, dealership.address?.line2, dealership.address?.city, dealership.address?.postcode]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="min-h-screen bg-[#111111] text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl tracking-[0.2em] font-light uppercase mb-12 border-b border-zinc-800 pb-8">
          Complaints Policy
        </h1>
        
        <div className="space-y-8 text-zinc-300 font-light leading-relaxed text-sm md:text-base">
          <p>
            {`At ${dealership.name}, we strive to ensure that all customers receive a high standard of service. If you are unhappy with the service you have received or the vehicle you purchased, we want to hear from you so we can put things right.`}
          </p>
          
          <h2 className="text-xl tracking-widest uppercase font-semibold text-white mt-12 mb-6">How to make a complaint</h2>
          <p>
            If you have a complaint, please do not hesitate to reach out to us. You can contact us in the following ways:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
            {dealership.phone && <li>By telephone: {dealership.phone}</li>}
            {dealership.email && <li>By email: {dealership.email}</li>}
            {postalAddress && <li>In writing: {postalAddress}</li>}
          </ul>

          <h2 className="text-xl tracking-widest uppercase font-semibold text-white mt-12 mb-6">What happens next?</h2>
          <p>
            We will aim to resolve your complaint as quickly and efficiently as possible. Where possible, we will try to resolve your complaint within 3 working days of receiving it. If we need more time to investigate your complaint, we will acknowledge receipt of your complaint in writing and keep you updated on the progress of our investigation.
          </p>

          <h2 className="text-xl tracking-widest uppercase font-semibold text-white mt-12 mb-6">Our commitment</h2>
          <p>
            We will write to you with our final response within 8 weeks of receiving your complaint. If you remain dissatisfied with our response, or we have not provided a final response within 8 weeks, you may be entitled to refer the matter to the Financial Ombudsman Service.
          </p>
        </div>
      </div>
    </main>
  )
}
