import { useOutletContext } from 'react-router-dom'
import type { Project } from '../../types'

export function useProjectOutlet() {
  return useOutletContext<{ project: Project }>()
}
