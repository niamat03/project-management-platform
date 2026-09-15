import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | 'full'
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  full: 'max-w-5xl',
}

export function Modal({ open, onClose, title, children, size = 'lg' }: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      {/* Leaflet's own controls/panes use z-index up to 1000 (see leaflet.css),
          and a map stays mounted behind this modal on map-heavy pages
          (Explore, a project's Map tab) - z-1200 keeps the dialog above it. */}
      <Dialog onClose={onClose} className="relative z-1200">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className={`w-full ${SIZE_CLASSES[size]} max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl`}>
              {title && (
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
                  <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
