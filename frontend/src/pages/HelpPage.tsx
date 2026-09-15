import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { type ReactNode } from 'react'

interface Section {
  id: string
  title: string
  body: ReactNode
}

const SECTIONS: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    body: (
      <>
        <p>
          Register or log in from the sign-in screen, then land on your <b>Dashboard</b> — it
          summarizes your projects, tasks due today, overdue items, upcoming deadlines, and
          recent activity across everything you're a member of.
        </p>
        <p>
          The sidebar is your main way around the app: <b>My Tasks</b> (everything assigned to
          you across every project), <b>Projects</b> (your workspaces), <b>Calendar</b>
          (all tasks by date), and <b>Map / Explore</b> (everything with a location).
        </p>
      </>
    ),
  },
  {
    id: 'projects-roles',
    title: 'Projects, teams & roles',
    body: (
      <>
        <p>
          A <b>project</b> is a shared workspace: name, description, status (Planning / Active /
          On Hold / Completed / Archived), priority, dates, and an optional map location.
          Creating one automatically sets up a starter board (Backlog → To Do → In Progress →
          Review → Done) and makes you its <b>Owner</b>.
        </p>
        <p>Invite teammates from a project's <b>Members</b> tab and assign each one a role:</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Can do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="px-3 py-2 font-medium">Owner</td><td className="px-3 py-2 text-slate-600">Everything, including deleting the project.</td></tr>
              <tr><td className="px-3 py-2 font-medium">Admin</td><td className="px-3 py-2 text-slate-600">Manage members/roles, board structure, and all tasks.</td></tr>
              <tr><td className="px-3 py-2 font-medium">Manager</td><td className="px-3 py-2 text-slate-600">Manage the board, tags, and assign/reassign tasks.</td></tr>
              <tr><td className="px-3 py-2 font-medium">Member</td><td className="px-3 py-2 text-slate-600">Create and edit tasks, comment, update their own work.</td></tr>
              <tr><td className="px-3 py-2 font-medium">Viewer</td><td className="px-3 py-2 text-slate-600">Read-only access to everything in the project.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Every permission is enforced by the server, not just hidden in the interface — so
          what a role can't do here, it can't do at all.
        </p>
      </>
    ),
  },
  {
    id: 'board-tasks',
    title: 'Board & tasks',
    body: (
      <>
        <p>
          The <b>Board</b> tab is a Kanban view: drag a task card between columns to change its
          status — the move is saved immediately and other people viewing the same board see it
          update live, no refresh needed. Use <b>Manage columns</b> to rename, add, or reorder
          columns if your role allows it.
        </p>
        <p>
          Click any card to open its detail panel: description, status, priority, dates,
          progress, estimated/actual hours, tags, subtasks, attachments, assignees, and — if
          the task has one — its map location. Multiple people can be assigned to a task; add or
          remove them from the assignee list in the Details tab.
        </p>
        <p>
          Prefer a spreadsheet-style view? Use <b>List</b> for a sortable, filterable table
          (status, priority, assignee, due date), with CSV export. Use <b>Calendar</b> to see
          tasks laid out by start/due date and spot overdue or clustered deadlines at a glance.
        </p>
      </>
    ),
  },
  {
    id: 'collaboration',
    title: 'Comments, activity & notifications',
    body: (
      <>
        <p>
          Every task has a <b>Comments</b> thread — write <code>@username</code> in a comment to
          notify that person directly. You can edit or delete your own comments; project Admins
          can also remove any comment.
        </p>
        <p>
          The <b>Activity</b> tab (on a task or a whole project) is a running audit log — who
          created what, moved a task, changed its priority, commented, or joined the team — so
          you always have a clear history of what happened and when.
        </p>
        <p>
          The bell icon in the top bar shows unread <b>notifications</b>: assignments,
          reassignments, new comments, mentions, project invitations, and status changes. Click
          one to jump straight to the task or project it refers to.
        </p>
      </>
    ),
  },
  {
    id: 'map',
    title: 'Map, locations & "Tasks near me"',
    body: (
      <>
        <p>
          Projects and tasks can optionally carry a real-world location — a single site (point),
          a corridor (line), or a zone (polygon) — set from a project's <b>Settings</b> tab or a
          task's detail panel. Each project's <b>Map</b> tab shows only that project's
          geography; the sidebar's <b>Map / Explore</b> shows everything across every project
          you belong to, with nearby markers automatically clustered as you zoom out.
        </p>
        <p>
          Click <b>Tasks near me</b> on the Explore page to search by real distance: it asks your
          browser for your current position — only when you click it, never automatically — and
          returns tasks within the radius you choose (2–25 km), ordered by actual distance,
          computed by the database rather than in the browser.
        </p>
        <p>
          Locations can be marked <b>Public</b>, <b>Project members only</b>, or <b>Private</b>
          (Admin+ only) — a location's own visibility is enforced everywhere it could appear,
          including the map and nearby search.
        </p>
      </>
    ),
  },
  {
    id: 'search',
    title: 'Search',
    body: (
      <p>
        The search bar at the top works across projects, tasks, and people at once — start
        typing and results are grouped by type. For heavier task filtering (by status, priority,
        assignee, due date, or project) use a project's <b>List</b> tab instead.
      </p>
    ),
  },
  {
    id: 'tips',
    title: 'Tips',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Most fields in a task's detail panel save automatically on blur — no separate "Save" button to hunt for.</li>
        <li>You can turn any task into a checklist of work by adding subtasks (a "parent task" link) instead of one giant description.</li>
        <li>Two people can safely have the same project board open at once — live updates keep everyone in sync over WebSockets.</li>
        <li>Deleting a task also deletes its comments and attachments — there's a confirmation step before that happens.</li>
      </ul>
    ),
  },
]

export function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User guide</h1>
        <p className="mt-1 text-sm text-slate-500">
          A quick reference for finding your way around Selena. Click a section to expand it.
        </p>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <Disclosure key={section.id} as="div" className="rounded-xl border border-slate-200 bg-white" defaultOpen={section.id === 'getting-started'}>
            {({ open }) => (
              <>
                <DisclosureButton
                  id={section.id}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  {section.title}
                  <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </DisclosureButton>
                <DisclosurePanel className="space-y-3 border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
                  {section.body}
                </DisclosurePanel>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}
