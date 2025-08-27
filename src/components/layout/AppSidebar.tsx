import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWorkspaceNavigation } from '@/hooks/useWorkspaceNavigation'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard, 
  FileText, 
  Palette, 
  Image, 
  Settings,
  Crown,
  Palette as PaletteIcon,
  Globe,
  Sparkles
} from 'lucide-react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'
import { useKeyboardNavigation, useFocusManagement } from '@/hooks/useKeyboardNavigation'
import { useAdminRole } from '@/hooks/useAdminRole'
import { useEffect, useRef } from 'react'

const getMainItems = (canManageTemplates: boolean, canUploadMedia: boolean) => [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Documents', url: '/documents', icon: FileText },
  ...(canManageTemplates ? [{ title: 'Template Library', url: '/templates', icon: Palette }] : []),
  ...(canUploadMedia ? [{ title: 'Media Library', url: '/media', icon: Image }] : []),
]

const adminItems = [
  { title: 'Admin Panel', url: '/admin', icon: Crown },
]

const systemItems = [
  { title: 'Global Template Generator', url: '/system/template-generator', icon: Sparkles },
  { title: 'Global Templates', url: '/system/templates', icon: Globe },
]

const bottomItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { focusedSection, setFocusedSection, announce } = useAccessibility()
  const { updateFocusableElements, focusNext, focusPrevious } = useFocusManagement()
  const { isAdmin } = useAdminRole()
  const { currentWorkspaceId, getCurrentWorkspacePath } = useWorkspaceNavigation()
  const { canManageTemplates, canUploadMedia } = usePermissions()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const currentPath = getCurrentWorkspacePath()
  const isCollapsed = state === 'collapsed'
  const isFocused = focusedSection === 'sidebar'
  const mainItems = getMainItems(canManageTemplates, canUploadMedia)

  useEffect(() => {
    if (sidebarRef.current) {
      updateFocusableElements(sidebarRef.current)
    }
  }, [updateFocusableElements, isCollapsed])

  useKeyboardNavigation({
    onArrowDown: () => isFocused && focusNext(),
    onArrowUp: () => isFocused && focusPrevious(),
    onEnter: () => {
      if (isFocused) {
        const focusedElement = globalThis.document.activeElement as HTMLElement
        focusedElement?.click()
      }
    },
    enabled: isFocused
  })

  const handleFocus = () => {
    setFocusedSection('sidebar')
    announce('Navigating sidebar')
  }

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50'

  return (
    <Sidebar
      ref={sidebarRef}
      className="border-sidebar-border bg-sidebar"
      collapsible="icon"
      onFocus={handleFocus}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
              <PaletteIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">PageMuse</span>
          </div>
        )}
        <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent rounded-md" />
      </div>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium">
            {!isCollapsed && 'WORKSPACE'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={currentWorkspaceId ? `/w/${currentWorkspaceId}${item.url}` : item.url}
                      end 
                      className={getNavCls}
                      title={isCollapsed ? item.title : undefined}
                      aria-label={item.title}
                      role="menuitem"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only show for admin users */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium">
              {!isCollapsed && 'ADMIN'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={currentWorkspaceId ? `/w/${currentWorkspaceId}${item.url}` : item.url}
                        className={getNavCls}
                        title={isCollapsed ? item.title : undefined}
                        aria-label={item.title}
                        role="menuitem"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System Section - Only show for SystemAdmin users */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium">
              {!isCollapsed && 'SYSTEM'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={getNavCls}
                        title={isCollapsed ? item.title : undefined}
                        aria-label={item.title}
                        role="menuitem"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Bottom Navigation */}
        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                        <NavLink 
                          to={currentWorkspaceId ? `/w/${currentWorkspaceId}${item.url}` : item.url}
                          className={getNavCls}
                          title={isCollapsed ? item.title : undefined}
                          aria-label={item.title}
                          role="menuitem"
                        >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}