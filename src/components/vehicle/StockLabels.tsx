import type { AutoTraderVehicle } from '@/utilities/autotrader'
import { photoLine, exVatNote } from '@/utilities/vehiclePresentation'
export function StockLabels({ vehicle }: { vehicle: AutoTraderVehicle }) {
  const line = photoLine(vehicle)
  return (
    <div className="pointer-events-none absolute inset-0">
      {vehicle.reserved && (
        <span className="absolute left-1/2 top-3 -translate-x-1/2 bg-[#21211e] px-3 py-2 text-sm font-semibold text-white">
          Reserved
        </span>
      )}
      {line && (
        <p className="absolute bottom-0 left-0 right-0 bg-[#21211e]/95 px-3 py-2 text-sm text-white">
          {line}
        </p>
      )}
    </div>
  )
}
export function VatNote({ vehicle }: { vehicle: AutoTraderVehicle }) {
  const note = exVatNote(vehicle)
  return note ? <span className="block text-xs text-zinc-400">{note}</span> : null
}
