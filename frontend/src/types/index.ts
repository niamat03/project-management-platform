export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'
export type ProjectRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
export type SpatialType = 'point' | 'line' | 'polygon' | 'multipolygon'
export type LocationVisibility = 'public' | 'members' | 'private'

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'
  coordinates: any
}

export interface GeoJSONFeature<P = Record<string, any>> {
  type: 'Feature'
  geometry: GeoJSONGeometry | null
  properties: P
}

export interface GeoJSONFeatureCollection<P = Record<string, any>> {
  type: 'FeatureCollection'
  features: GeoJSONFeature<P>[]
}

export interface UserSummary {
  id: number
  username: string
  first_name: string
  last_name: string
  avatar: string | null
}

export interface Profile {
  avatar: string | null
  bio: string
  job_title: string
  created_at: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
  profile: Profile
}

export interface ProjectMember {
  id: number
  user: UserSummary
  role: ProjectRole
  joined_at: string
}

export interface BoardColumn {
  id: number
  board: number
  name: string
  position: number
  created_at: string
}

export interface Board {
  id: number
  project: number
  columns: BoardColumn[]
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string
  owner: UserSummary
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  member_count: number
  task_count: number
  my_role: ProjectRole | null
  members?: ProjectMember[]
  location_name: string
  address?: string
  spatial_type: SpatialType | null
  location_visibility?: LocationVisibility
  geometry: GeoJSONGeometry | null
}

export interface Tag {
  id: number
  project: number
  name: string
  color: string
}

export interface TaskAssignee {
  id: number
  user: UserSummary
  assigned_at: string
  assigned_by: number | null
}

export interface Attachment {
  id: number
  task: number
  file: string
  filename: string
  size: number
  uploaded_by: UserSummary
  uploaded_at: string
}

export interface Task {
  id: number
  project: number
  board: number
  column: number | null
  creator: UserSummary
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  position: number
  estimated_hours: string | null
  actual_hours: string | null
  progress: number
  parent_task: number | null
  assignees: TaskAssignee[]
  tags: Tag[]
  created_at: string
  updated_at: string
  is_overdue: boolean
  location_name: string
  address?: string
  spatial_type: SpatialType | null
  location_visibility?: LocationVisibility
  geometry: GeoJSONGeometry | null
  attachments?: Attachment[]
}

export interface Comment {
  id: number
  task: number
  author: UserSummary
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
}

export type NotificationType =
  | 'task_assigned' | 'task_reassigned' | 'task_unassigned' | 'new_comment'
  | 'mention' | 'project_invitation' | 'task_deadline' | 'task_status_changed'
  | 'project_update'

export interface Notification {
  id: number
  actor: UserSummary | null
  notification_type: NotificationType
  message: string
  project: number | null
  task: number | null
  is_read: boolean
  created_at: string
}

export interface Activity {
  id: number
  project: number
  task: number | null
  actor: UserSummary | null
  verb: string
  description: string
  metadata: Record<string, any>
  created_at: string
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
}

export interface GlobalDashboard {
  stats: DashboardStats
  my_projects: Pick<Project, 'id' | 'name' | 'status' | 'priority'>[]
  due_today: Task[]
  upcoming_deadlines: Task[]
  overdue_tasks: Task[]
  recent_activity: Activity[]
  notifications: Notification[]
}

export interface ProjectDashboard {
  project: { id: number; name: string; status: ProjectStatus }
  progress: number
  task_stats: { total: number; completed: number; overdue: number }
  status_distribution: { status: TaskStatus; count: number }[]
  priority_distribution: { priority: Priority; count: number }[]
  member_count: number
  upcoming_deadlines: Task[]
  overdue_tasks: Task[]
  recent_activity: Activity[]
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface NearbyTaskResult {
  id: number
  title: string
  project: number
  project_name: string
  priority: Priority
  status: TaskStatus
  due_date: string | null
  assignees: string[]
  distance_km: number
  location_name: string
  geometry: GeoJSONGeometry | null
}
