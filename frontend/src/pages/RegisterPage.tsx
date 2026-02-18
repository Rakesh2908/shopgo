import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

import { Layout } from '@/components/layout'
import type { ApiResponse } from '@/types'
import { Button, Input } from '@/components/ui'
import { useRegister } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const registerMutation = useRegister()

  useEffect(() => {
    document.title = 'Create Account | ShopGo'
    return () => {
      document.title = 'ShopGo'
    }
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (values: FormValues) => {
    try {
      await registerMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? (err.response?.data as ApiResponse<unknown> | undefined)?.error?.message
          : undefined
      toast.error(msg ?? (err instanceof Error ? err.message : 'Registration failed'))
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-semibold text-primary">Create account</h1>
            <p className="mt-1 text-sm text-slate-600">
              Join ShopGo to save items, checkout faster, and track orders.
            </p>

            <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Input
                label="Full name"
                placeholder="Jane Doe"
                register={form.register('fullName')}
                error={form.formState.errors.fullName?.message}
                autoComplete="name"
              />
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
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                register={form.register('confirmPassword')}
                error={form.formState.errors.confirmPassword?.message}
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" loading={registerMutation.isPending}>
                Register
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

