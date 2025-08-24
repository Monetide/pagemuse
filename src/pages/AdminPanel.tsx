import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { IRSchemaPanel } from '@/components/admin/IRSchemaPanel'
import { 
  Users, 
  FileText, 
  Palette, 
  Settings,
  UserPlus,
  Shield,
  Activity,
  TrendingUp,
  Crown,
  Database,
  ChevronRight,
  Code2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats'

export default function AdminPanel() {
  const { stats, recentActivity, topTemplates, loading, error } = useAdminDashboardStats()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText
      case 'template': return Palette
      case 'user': return Users
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-blue-600'
      case 'template': return 'text-purple-600'
      case 'user': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load admin stats: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users, content, and system settings
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
          <Settings className="w-4 h-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers > 0 ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% are active` : 'No activity yet'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalUsers > 0 ? `${stats.activeUsers} currently active` : 'No users yet'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalDocuments > 0 ? 'Total created by users' : 'No documents yet'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTemplates}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalTemplates > 0 ? 'Available in library' : 'No templates yet'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                <Palette className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="schema">IR Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type)
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-lg bg-muted ${getActivityColor(activity.type)}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
                <Button variant="ghost" className="w-full mt-4">
                  View All Activity
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Top Templates */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Popular Templates
                </CardTitle>
                <CardDescription>
                  Most used templates this month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topTemplates.length > 0 ? (
                  topTemplates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{template.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {template.usage} uses
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No template usage data yet</p>
                  </div>
                )}
                <Button variant="ghost" className="w-full mt-4">
                  View All Templates
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <UserPlus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
              <p className="text-muted-foreground mb-6">
                User management features coming soon
              </p>
              <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Templates Management */}
            <Card className="border-0 shadow-soft hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <Link to="/admin/templates">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Templates
                  </CardTitle>
                  <CardDescription>
                    Manage global templates and visibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Palette className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalTemplates} templates available
                  </p>
                </CardContent>
              </Link>
            </Card>

            {/* Documents Management */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Review and moderate user documents
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {stats.totalDocuments} documents created
                </p>
                <Button variant="outline" size="sm">
                  Review Content
                </Button>
              </CardContent>
            </Card>

            {/* Media Management */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Media Library
                </CardTitle>
                <CardDescription>
                  Manage uploaded media and assets
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {stats.storageUsed} storage used
                </p>
                <Button variant="outline" size="sm">
                  Manage Media
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Monitor system performance and health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Status</span>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Used</span>
                  <span className="text-sm text-muted-foreground">{stats.storageUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Configuration</h3>
                <p className="text-muted-foreground mb-6">
                  System configuration panel coming soon
                </p>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Open Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schema">
          <IRSchemaPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}