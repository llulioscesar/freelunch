import { HeadContent, Outlet, Scripts, createRootRoute, useLocation, Navigate } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '../components/layout'
import { FloatingChat } from '../components/FloatingChat'
import { AuthProvider, useAuth } from '../lib/auth'

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
  const { isAuthenticated } = useAuth()
  const isLoginPage = location.pathname === '/login'

  // Login page - no layout needed
  if (isLoginPage) {
    return <Outlet />
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />
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
