import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { Layout } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { useLogin } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawFrom = searchParams.get('from') ?? '/'
  const from =
    rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const loginMutation = useLogin()

  useEffect(() => {
    document.title = 'Login | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  const onSubmit = async (values: FormValues) => {
    try {
      await loginMutation.mutateAsync(values)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-600">
              Log in to view your orders, wishlist, and checkout.
            </p>

            <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                register={form.register('email')}
                error={form.formState.errors.email?.message}
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                register={form.register('password')}
                error={form.formState.errors.password?.message}
                autoComplete="current-password"
              />

              <Button type="submit" className="w-full" loading={loginMutation.isPending}>
                Login
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don’t have an account?{' '}
              <Link to="/register" className="font-medium text-accent hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

