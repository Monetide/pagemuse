import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ViewModeToggle } from '@/components/document/ViewModeToggle'
import { ValidationButton } from '@/components/document/ValidationButton'
import { useAuth } from '@/hooks/useAuth'
import { useAdminRole } from '@/hooks/useAdminRole'
import { useWorkspaceNavigation } from '@/hooks/useWorkspaceNavigation'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { User, LogOut, Settings, Shield } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

export function AppHeader() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminRole()
  const { currentWorkspaceId } = useWorkspaceNavigation()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  const userDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const userInitials = userDisplayName.slice(0, 2).toUpperCase()

  // Determine if we're on a system route
  const isSystemRoute = location.pathname.startsWith('/system')
  
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Documents', path: '/documents' },
    { name: 'Templates', path: '/templates' },
    { name: 'Media', path: '/media' },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
  ]

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo and Workspace Switcher */}
        <div className="flex items-center space-x-4">
          <NavLink to={currentWorkspaceId ? `/w/${currentWorkspaceId}/dashboard` : '/dashboard'} className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PageMuse
            </span>
          </NavLink>
          {!isSystemRoute && <WorkspaceSwitcher />}
        </div>
        {/* Navigation Links */}
        <nav className="flex items-center space-x-6">
          {!isSystemRoute && navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={currentWorkspaceId ? `/w/${currentWorkspaceId}${item.path}` : item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
          {isSystemRoute && (
            <span className="text-sm font-medium text-muted-foreground">
              System Administration
            </span>
          )}
        </nav>

        {/* View Mode Toggle and Validation - only show on document pages */}
        {location.pathname.includes('/document') && (
          <div className="flex items-center gap-4">
            <ValidationButton />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <ViewModeToggle />
            </div>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{userDisplayName}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to={isSystemRoute ? '/system/template-generator' : (currentWorkspaceId ? `/w/${currentWorkspaceId}/admin` : '/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    {isSystemRoute ? 'System Admin' : 'Admin Panel'}
                  </NavLink>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  )
}