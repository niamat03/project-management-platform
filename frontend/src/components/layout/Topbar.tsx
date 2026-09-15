import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { NotificationPanel } from '../notifications/NotificationPanel'
import { SidebarToggle } from './Sidebar'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const initials = user ? (user.first_name?.[0] ?? user.username[0]).toUpperCase() : '?'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <SidebarToggle onClick={onMenuClick} />

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, people…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <NotificationPanel />
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100">
            {user?.profile.avatar ? (
              <img src={user.profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {initials}
              </div>
            )}
          </MenuButton>
          <MenuItems anchor="bottom end" className="z-1100 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{user?.username}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <MenuItem>
              <button onClick={() => navigate('/profile')} className="block w-full px-3 py-2 text-left text-sm text-slate-600 data-focus:bg-slate-50">
                Profile & Settings
              </button>
            </MenuItem>
            <MenuItem>
              <button onClick={logout} className="block w-full px-3 py-2 text-left text-sm text-rose-600 data-focus:bg-rose-50">
                Log out
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </header>
  )
}
