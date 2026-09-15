import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CalendarPage } from './pages/CalendarPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExplorePage } from './pages/ExplorePage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { MyTasksPage } from './pages/MyTasksPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProjectActivityPage } from './pages/projects/ProjectActivityPage'
import { ProjectBoardPage } from './pages/projects/ProjectBoardPage'
import { ProjectCalendarPage } from './pages/projects/ProjectCalendarPage'
import { ProjectDetailLayout } from './pages/projects/ProjectDetailLayout'
import { ProjectListViewPage } from './pages/projects/ProjectListViewPage'
import { ProjectMapPage } from './pages/projects/ProjectMapPage'
import { ProjectMembersPage } from './pages/projects/ProjectMembersPage'
import { ProjectOverviewPage } from './pages/projects/ProjectOverviewPage'
import { ProjectSettingsPage } from './pages/projects/ProjectSettingsPage'
import { ProjectsListPage } from './pages/ProjectsListPage'
import { SearchPage } from './pages/SearchPage'
import { TaskRedirectPage } from './pages/TaskRedirectPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="tasks/:taskId" element={<TaskRedirectPage />} />

        <Route path="projects" element={<ProjectsListPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailLayout />}>
          <Route index element={<ProjectOverviewPage />} />
          <Route path="board" element={<ProjectBoardPage />} />
          <Route path="list" element={<ProjectListViewPage />} />
          <Route path="calendar" element={<ProjectCalendarPage />} />
          <Route path="map" element={<ProjectMapPage />} />
          <Route path="activity" element={<ProjectActivityPage />} />
          <Route path="members" element={<ProjectMembersPage />} />
          <Route path="settings" element={<ProjectSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
