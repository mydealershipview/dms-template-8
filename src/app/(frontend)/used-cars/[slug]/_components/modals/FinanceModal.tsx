import FormProtection from '@/forms/FormProtection'
import EnquiryDialog from '@/components/vehicle/EnquiryDialog'
import React, { useId, useMemo, useState } from 'react'
import { buildBaseWebhookPayload, submitWebhookForm, withInterestedVehicle } from './formSubmission'
import { WebhookData } from '@/types/webhook'

type EmploymentStatus = NonNullable<WebhookData['employment']>['status']

interface FinanceModalProps {
  vehicleMake: string
  vehicleModel: string
  vehicleReg: string
  vehiclePrice: number | null
  stockId?: string
  onClose: () => void
}

const employmentOptions: EmploymentStatus[] = [
  'Employed Full-Time',
  'Employed Part-Time',
  'Self-Employed',
  'Unemployed',
  'Retired',
  'Student',
  'Annuitant',
  'Pensioner',
  'Other',
]

export default function FinanceModal({
  vehicleMake,
  vehicleModel,
  vehicleReg,
  vehiclePrice,
  stockId,
  onClose,
}: FinanceModalProps) {
  const formId = useId()
  const [title, setTitle] = useState('Mr')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [deposit, setDeposit] = useState(vehiclePrice ? Math.round(vehiclePrice * 0.1) : 0)
  const [term, setTerm] = useState(60)
  const [apr, setApr] = useState(9.9)

  const [gender, setGender] = useState('Prefer not to say')
  const [country, setCountry] = useState('United Kingdom')
  const [dependents, setDependents] = useState(0)
  const [maritalStatus, setMaritalStatus] = useState('Single')
  const [address, setAddress] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessYears, setBusinessYears] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessVat, setBusinessVat] = useState('')

  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('Employed Full-Time')
  const [employerName, setEmployerName] = useState('')
  const [annualIncome, setAnnualIncome] = useState(0)
  const [timeInEmployment, setTimeInEmployment] = useState('')

  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [creditCommitments, setCreditCommitments] = useState(0)

  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [sortCode, setSortCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [timeWithBank, setTimeWithBank] = useState('')

  const [additionalInfo, setAdditionalInfo] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const monthlyPayment = useMemo(() => {
    if (!vehiclePrice) return 0
    const loanAmount = vehiclePrice - deposit
    if (loanAmount <= 0) return 0
    const monthlyRate = (apr / 100) / 12
    if (monthlyRate <= 0) return loanAmount / term
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
  }, [apr, deposit, term, vehiclePrice])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const basePayload = buildBaseWebhookPayload({
        enquiryType: 'request-finance',
        title,
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        address,
      })
      

      const payload = withInterestedVehicle(basePayload, {
        stockId,
        make: vehicleMake,
        model: vehicleModel,
        registration: vehicleReg,
        price: vehiclePrice,
      })

      if (payload.vehicle) {
        payload.vehicle = {
          ...payload.vehicle,
          initialDeposit: Number(deposit) || 0,
          loanTerm: Number(term) || 0,
          apr: Number(apr) || 0,
          amountToFinance: vehiclePrice ? Math.max(vehiclePrice - deposit, 0) : null,
          monthlyPayment: Number(monthlyPayment.toFixed(2)),
        }
      }

      payload.personal = {
        ...payload.personal,
        gender,
        countryOfOrigin: country,
        maritalStatus,
        dependents: Number.isFinite(dependents) ? dependents : 0,
      }

      payload.employment = {
        status: employmentStatus,
        annualIncome: Number(annualIncome) || 0,
        employerName: employerName || businessName,
        timeInEmployment: timeInEmployment || 'Not provided',
        grossAnnualIncome: Number(annualIncome) || 0,
      }

      payload.finance = {
        monthlyExpenses: Number(monthlyExpenses) || 0,
        existenceCreditCommitments: Number(creditCommitments) || 0,
      }

      payload.bank = {
        accountHolderName,
        bankName,
        sortCode,
        accountNumber,
        timeWithBank,
      }

      payload.notes = [
        additionalInfo ? `Additional info: ${additionalInfo}` : null,
        businessName ? `Business name: ${businessName}` : null,
        businessType ? `Business type: ${businessType}` : null,
        businessYears ? `Business years: ${businessYears}` : null,
        businessPhone ? `Business phone: ${businessPhone}` : null,
        businessVat ? `VAT: ${businessVat}` : null,
      ]
        .filter(Boolean)
        .join('\n') || null

      await submitWebhookForm(payload, e.currentTarget)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit finance request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EnquiryDialog label="Finance application" onClose={onClose}>
      <div className="w-full max-w-3xl bg-[#161616] border border-white/10 p-6 md:p-8 shadow-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-light tracking-widest uppercase">Finance Application</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm uppercase tracking-widest transition-colors">
            Close
          </button>
        </div>

        <div className="overflow-y-auto hide-scrollbar pr-2 flex-1">
          <div className="mb-8 p-6 bg-zinc-900 border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <p className="text-sm text-zinc-400 uppercase tracking-widest mb-1">Applying for</p>
              <p className="text-lg font-medium">{vehicleMake} {vehicleModel}</p>
              <p className="text-sm text-zinc-400 mt-1">Reg: {vehicleReg || 'N/A'}</p>
              <p className="text-sm text-zinc-400 mt-1">Vehicle Price: £{vehiclePrice ? new Intl.NumberFormat('en-GB').format(vehiclePrice) : 'POA'}</p>
            </div>

            <div className="w-full md:w-auto bg-black/30 p-4 border border-white/10 text-center">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Estimated Monthly</p>
              <p className="text-3xl font-light">£{monthlyPayment.toFixed(2)}</p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${formId}-field-1`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Title</label>
                  <select id={`${formId}-field-1`} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none">
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Miss</option>
                    <option>Ms</option>
                    <option>Dr</option>
                  </select>
                </div>
                <div />
                <div>
                  <label htmlFor={`${formId}-field-2`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">First Name</label>
                  <input id={`${formId}-field-2`} value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" required className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-3`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Last Name</label>
                  <input id={`${formId}-field-3`} value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" required className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-4`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Email</label>
                  <input id={`${formId}-field-4`} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-5`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Phone</label>
                  <input id={`${formId}-field-5`} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${formId}-field-6`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Initial Deposit (£)</label>
                  <input id={`${formId}-field-6`} type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-7`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Loan Term (Months)</label>
                  <select id={`${formId}-field-7`} value={term} onChange={(e) => setTerm(Number(e.target.value))} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none">
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                    <option value={48}>48 Months</option>
                    <option value={60}>60 Months</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`${formId}-field-8`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">APR (%)</label>
                  <input id={`${formId}-field-8`} type="number" step="0.1" value={apr} onChange={(e) => setApr(Number(e.target.value))} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${formId}-field-9`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Gender</label>
                  <select id={`${formId}-field-9`} value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`${formId}-field-10`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Country</label>
                  <input id={`${formId}-field-10`} value={country} onChange={(e) => setCountry(e.target.value)} type="text" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-11`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Number of Dependents</label>
                  <input id={`${formId}-field-11`} value={dependents} onChange={(e) => setDependents(Number(e.target.value))} type="number" min="0" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label htmlFor={`${formId}-field-12`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Marital Status</label>
                  <select id={`${formId}-field-12`} value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none">
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Address Info</h3>
              <textarea aria-label="Home address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Business Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} type="text" placeholder="Business Name" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} type="text" placeholder="Business Type" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={businessYears} onChange={(e) => setBusinessYears(e.target.value)} type="text" placeholder="Years in Business" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} type="tel" placeholder="Business Phone" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <div className="md:col-span-2">
                  <input value={businessVat} onChange={(e) => setBusinessVat(e.target.value)} type="text" placeholder="VAT Number" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Employment Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${formId}-field-13`} className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Status</label>
                  <select id={`${formId}-field-13`} value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none">
                    {employmentOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} type="text" placeholder="Employer Name" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value))} type="number" placeholder="Annual Income" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={timeInEmployment} onChange={(e) => setTimeInEmployment(e.target.value)} type="text" placeholder="Time in Employment" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Monthly Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} type="number" placeholder="Monthly Expenses" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={creditCommitments} onChange={(e) => setCreditCommitments(Number(e.target.value))} type="number" placeholder="Credit Commitments" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Bank Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} type="text" placeholder="Account Holder Name" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} type="text" placeholder="Bank Name" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={sortCode} onChange={(e) => setSortCode(e.target.value)} type="text" placeholder="Sort Code" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} type="text" placeholder="Account Number" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                <div className="md:col-span-2">
                  <input value={timeWithBank} onChange={(e) => setTimeWithBank(e.target.value)} type="text" placeholder="Time with Bank" className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white border-b border-white/10 pb-2">Additional Info</h3>
              <textarea aria-label="Additional information" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} rows={3} className="w-full bg-zinc-900 border border-white/10 p-3 text-sm text-white focus:outline-none" />
            </div>

            <div className="flex items-start gap-3 bg-white/5 p-4 border border-white/10">
              <input checked={agreed} onChange={(e) => setAgreed(e.target.checked)} type="checkbox" id="finance-terms" required className="mt-1" />
              <label htmlFor="finance-terms" className="text-xs text-zinc-400 leading-relaxed">
                I declare that the information provided is true and accurate. I authorize the dealership and its finance partners to carry out credit searches and identity checks.
              </label>
            </div>

            {submitError && (
              <p role="status" aria-live="polite" className="text-sm text-red-400">{submitError}</p>
            )}

            <FormProtection />
          <button disabled={isSubmitting || !agreed} type="submit" className="w-full bg-white text-black px-4 py-4 text-xs font-semibold tracking-widest uppercase hover:bg-zinc-200 transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </EnquiryDialog>
  )
}
