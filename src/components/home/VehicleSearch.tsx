'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Make,Model } from '@/utilities/types'
import { Search } from 'lucide-react'

interface VehicleSearchProps {
  makes: Make[]
  models: Model[]
}

export function VehicleSearch({ makes = [], models = [] }: VehicleSearchProps) {
  const router=useRouter(),[make,setMake]=useState(''),[model,setModel]=useState('');const makeId=makes.find(m=>m.name===make)?.makeId;const filtered=models.filter(m=>m.makeId===makeId)
  const search=(event:React.FormEvent)=>{event.preventDefault();const q=new URLSearchParams();if(make)q.set('make',make);if(model)q.set('model',model);router.push('/used-cars'+(q.size?'?'+q:''))}
  return (
    <section className="relative z-30 flex justify-center -mt-48 md:-mt-[280px] lg:-mt-[320px] px-4 w-full">
      <div className="bg-[#191919] w-full max-w-[900px] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">

        <div className="mb-8">
          <h2 className="text-[16px] md:text-[18px] font-semibold text-white uppercase tracking-[0.2em]">Shop Cars</h2>
        </div>

        <form onSubmit={search} className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Make Setup */}
          <div className="relative">
            <select aria-label="Make" value={make} onChange={e=>{setMake(e.target.value);setModel('')}} className="bg-transparent border border-zinc-700/60 text-zinc-300 text-sm p-4 w-full appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer">
              <option value="" className="text-black">Any Make</option>
              {makes?.map((item: any, i) => {
                const makeName = typeof item === 'string' ? item : (item?.name || item?.title || 'Unknown Make')
                return (
                  <option key={i} value={makeName} className="text-black">{makeName}</option>
                )
              })}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Model Setup */}
          <div className="relative">
            <select aria-label="Model" value={model} disabled={!make} onChange={e=>setModel(e.target.value)} className="bg-transparent border border-zinc-700/60 text-zinc-600 text-sm p-4 w-full appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer disabled:opacity-50">
              <option value="" className="text-black">Any Model</option>{filtered.map(item=><option key={item.modelId} value={item.name}>{item.name}</option>)}
              {/* Models mapped based on make selection normally */}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-white text-black text-[13px] font-bold tracking-[0.15em] uppercase p-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3"
            >
              <Search className="w-[18px] h-[18px]" />
              Search
            </button>
          </div>

        </form>
      </div>
    </section>
  )
}
