import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { 
  Plus, 
  FileText, 
  Palette, 
  TrendingUp, 
  Clock,
  Star,
  Users,
  BarChart3
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'

  // Mock data - replace with real data from Supabase
  const stats = [
    { label: 'Total Documents', value: '12', icon: FileText, color: 'text-blue-600' },
    { label: 'Templates Used', value: '5', icon: Palette, color: 'text-purple-600' },
    { label: 'This Month', value: '+3', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Hours Saved', value: '24', icon: Clock, color: 'text-orange-600' },
  ]

  const recentDocuments = [
    { id: 1, name: 'Q4 Business Report', template: 'Business Report', updatedAt: '2 hours ago', status: 'Draft' },
    { id: 2, name: 'Marketing Proposal', template: 'Proposal Template', updatedAt: '1 day ago', status: 'Completed' },
    { id: 3, name: 'Team Newsletter', template: 'Newsletter', updatedAt: '3 days ago', status: 'Published' },
  ]

  const popularTemplates = [
    { id: 1, name: 'Business Report', category: 'Business', usage: 156, rating: 4.8 },
    { id: 2, name: 'Project Proposal', category: 'Business', usage: 142, rating: 4.9 },
    { id: 3, name: 'Marketing Flyer', category: 'Marketing', usage: 98, rating: 4.7 },
    { id: 4, name: 'Resume Template', category: 'Personal', usage: 87, rating: 4.6 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Let's create something amazing today
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Documents
            </CardTitle>
            <CardDescription>
              Your latest work and drafts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {doc.template} • {doc.updatedAt}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  doc.status === 'Completed' ? 'bg-success/10 text-success' :
                  doc.status === 'Published' ? 'bg-primary/10 text-primary' :
                  'bg-warning/10 text-warning'
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-4">
              View All Documents
            </Button>
          </CardContent>
        </Card>

        {/* Popular Templates */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Popular Templates
            </CardTitle>
            <CardDescription>
              Most used templates this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {popularTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{template.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{template.category}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {template.usage}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {template.rating}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Use Template
                </Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full mt-4">
              Browse All Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into your most common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 hover:shadow-soft transition-all">
              <FileText className="w-6 h-6 text-primary" />
              <span>Create Document</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 hover:shadow-soft transition-all">
              <Palette className="w-6 h-6 text-primary" />
              <span>Browse Templates</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 hover:shadow-soft transition-all">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}