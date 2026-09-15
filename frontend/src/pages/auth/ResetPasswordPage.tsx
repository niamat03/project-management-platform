import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { apiErrorMessage } from '../../services/api'
import { useSubmitGuard } from '../../hooks/useSubmitGuard'

export function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [handleSubmit, isSubmitting] = useSubmitGuard(async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (!uid || !token) {
      toast.error('This reset link is invalid.')
      return
    }
    try {
      await authService.confirmPasswordReset(uid, token, password)
      toast.success('Password reset. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'This reset link is invalid or has expired.'))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
