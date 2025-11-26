import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '../components/layout'

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
        <Layout>
          <Outlet />
        </Layout>
      </QueryClientProvider>
    </RootDocument>
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
