import type { Task } from '../types'

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function tasksToCsv(tasks: Task[]): string {
  const headers = ['Title', 'Status', 'Priority', 'Assignees', 'Due date', 'Project', 'Location']
  const rows = tasks.map((t) => [
    t.title,
    t.status,
    t.priority,
    t.assignees.map((a) => a.user.username).join('; '),
    t.due_date ?? '',
    String(t.project),
    t.location_name ?? '',
  ])
  const lines = [headers, ...rows].map((row) => row.map((v) => escapeCsvField(String(v))).join(','))
  return lines.join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
