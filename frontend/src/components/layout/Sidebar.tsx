import {
  Bars3Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  MapIcon,
  Squares2X2Icon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/my-tasks', label: 'My Tasks', icon: ClipboardDocumentListIcon },
  { to: '/projects', label: 'Projects', icon: Squares2X2Icon },
  { to: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  { to: '/explore', label: 'Map / Explore', icon: MapIcon },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-sm font-semibold text-slate-900">Selena</span>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={onClose} aria-label="Close menu">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <UserCircleIcon className="h-5 w-5" />
            Profile & Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
      <Bars3Icon className="h-5 w-5" />
    </button>
  )
}
