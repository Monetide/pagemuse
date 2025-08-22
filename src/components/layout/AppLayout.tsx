import { AppHeader } from './AppHeader'
import { ViewModeProvider } from '@/contexts/ViewModeContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ViewModeProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ViewModeProvider>
  )
}