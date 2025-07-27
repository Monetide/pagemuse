import { AppHeader } from './AppHeader'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <AppHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}