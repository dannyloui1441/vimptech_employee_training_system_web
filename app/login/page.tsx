'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setToken, decodeToken } from '@/lib/auth-client'
import { Shield, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 400) {
          setError('Please enter a valid email and password.')
        } else if (res.status === 401) {
          setError('Invalid email or password.')
        } else if (res.status === 403) {
          setError('Access denied for this account type.')
        } else {
          setError(data.error || 'Something went wrong. Please try again.')
        }
        return
      }

      // Store token (localStorage + cookie)
      setToken(data.token)

      // Decode role and redirect
      const payload = decodeToken(data.token)
      if (payload?.role === 'Trainer') {
        router.push('/trainer/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="space-y-2 text-center pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Management Login
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to the Training Management System
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <Button
                id="login-submit"
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-2">
                Forgot password? Contact your administrator.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
