import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../services/api'
import { authService } from '../services/authService'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    bio: user?.profile.bio ?? '',
    job_title: user?.profile.job_title ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      await authService.updateProfile({ avatar: file })
      await refreshUser()
      toast.success('Avatar updated')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not upload avatar.'))
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await authService.updateProfile(profileForm)
      await refreshUser()
      toast.success('Profile updated')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    try {
      await authService.changePassword(passwordForm.old_password, passwordForm.new_password)
      setPasswordForm({ old_password: '', new_password: '' })
      toast.success('Password changed')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not change password.'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile & Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{user.username} · {user.email}</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="relative h-16 w-16 shrink-0">
          {avatarPreview || user.profile.avatar ? (
            <img
              src={avatarPreview ?? user.profile.avatar!}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {(user.first_name?.[0] ?? user.username[0]).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {uploadingAvatar ? 'Uploading…' : 'Change photo'}
          </button>
          <p className="mt-1 text-xs text-slate-400">JPG or PNG, up to a few MB.</p>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
          />
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Profile information</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input value={profileForm.first_name} onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input value={profileForm.last_name} onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Job title</label>
          <input value={profileForm.job_title} onChange={(e) => setProfileForm((f) => ({ ...f, job_title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
          <textarea rows={3} value={profileForm.bio} onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={savingProfile} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={handlePasswordSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
          <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm((f) => ({ ...f, old_password: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={savingPassword} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60">
          {savingPassword ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </div>
  )
}
