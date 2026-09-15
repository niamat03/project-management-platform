import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { projectService } from '../../services/projectService'
import { userService } from '../../services/userService'
import type { ProjectRole, UserSummary } from '../../types'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useProjectOutlet } from './useProjectOutlet'

const ROLES: ProjectRole[] = ['admin', 'manager', 'member', 'viewer']
const CAN_MANAGE_ROLES: ProjectRole[] = ['owner', 'admin']

export function ProjectMembersPage() {
  const { project } = useProjectOutlet()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [role, setRole] = useState<ProjectRole>('member')

  const canManage = project.my_role != null && CAN_MANAGE_ROLES.includes(project.my_role)

  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['project-members', project.id],
    queryFn: () => projectService.members(project.id),
  })

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) { setResults([]); return }
    const users = await userService.search(value.trim())
    setResults(users)
  }

  const handleAdd = async (userId: number) => {
    try {
      await projectService.addMember(project.id, userId, role)
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] })
      setQuery('')
      setResults([])
      toast.success('Member added')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not add member.'))
    }
  }

  const handleRoleChange = async (memberId: number, newRole: ProjectRole) => {
    try {
      await projectService.updateMemberRole(project.id, memberId, newRole)
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update role.'))
    }
  }

  const handleRemove = async (memberId: number) => {
    try {
      await projectService.removeMember(project.id, memberId)
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not remove member.'))
    }
  }

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError) return <div className="p-6"><ErrorState /></div>

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {canManage && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Invite a member</h2>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by username or email…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <select value={role} onChange={(e) => setRole(e.target.value as ProjectRole)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {results.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-slate-700">{u.username}</span>
                  <button onClick={() => handleAdd(u.id)} className="text-xs font-medium text-brand-600 hover:underline">Add</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              {canManage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members?.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{m.user.username}</td>
                <td className="px-4 py-3">
                  {canManage && m.role !== 'owner' ? (
                    <select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value as ProjectRole)} className="rounded-md border border-slate-200 px-2 py-1 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs uppercase text-slate-500">{m.role}</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'owner' && (
                      <button onClick={() => handleRemove(m.id)} className="text-xs text-rose-500 hover:underline">Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
