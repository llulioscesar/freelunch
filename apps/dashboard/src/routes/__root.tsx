import { HeadContent, Outlet, Scripts, createRootRoute, useLocation, redirect } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '../components/layout'
import { FloatingChat } from '../components/FloatingChat'
import { AuthProvider } from '../lib/auth'

import appCss from '../styles.css?url'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000, // 10 seconds
      refetchOnWindowFocus: false,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'FreeLunch - Panel de Donación',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),

  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthenticatedLayout />
        </AuthProvider>
      </QueryClientProvider>
    </RootDocument>
  )
}

function AuthenticatedLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  // Check auth on protected routes
  if (!isLoginPage) {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('freelunch_auth') : null
    if (!stored) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return null
    }
  }

  // Login page - no layout
  if (isLoginPage) {
    return <Outlet />
  }

  // Authenticated pages - with layout
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <FloatingChat />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
