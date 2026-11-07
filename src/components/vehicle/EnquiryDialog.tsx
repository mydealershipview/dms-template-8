'use client'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
export default function EnquiryDialog({
  label,
  onClose,
  children,
}: {
  label: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto border-0 bg-transparent p-0 text-white [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">
          Send a protected enquiry to the dealership. Your details are retained if delivery is
          pending.
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}
