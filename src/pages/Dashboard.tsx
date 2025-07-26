import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments, useTemplates, useUserStats } from '@/hooks/useSupabaseData'
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
  const { documents, loading: documentsLoading } = useDocuments()
  const { templates, loading: templatesLoading } = useTemplates()
  const { stats: userStats, loading: statsLoading } = useUserStats()
  
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'

  const stats = [
    { label: 'Total Documents', value: statsLoading ? '...' : userStats.totalDocuments.toString(), icon: FileText, color: 'text-blue-600' },
    { label: 'Templates Used', value: statsLoading ? '...' : userStats.templatesUsed.toString(), icon: Palette, color: 'text-purple-600' },
    { label: 'This Month', value: statsLoading ? '...' : `+${userStats.thisMonth}`, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Hours Saved', value: statsLoading ? '...' : userStats.hoursSaved.toString(), icon: Clock, color: 'text-orange-600' },
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getDocumentStatus = (document: any) => {
    // Simple logic - you can enhance this based on your document structure
    const hasContent = document.content && (Array.isArray(document.content) ? document.content.length > 0 : Object.keys(document.content).length > 0)
    const isRecent = new Date(document.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    if (!hasContent) return 'Draft'
    if (isRecent) return 'Active'
    return 'Completed'
  }

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
            {documentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents yet. Create your first document to get started!</p>
              </div>
            ) : (
              documents.slice(0, 3).map((doc) => {
                const status = getDocumentStatus(doc)
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.template?.name || 'Custom'} • {formatTimeAgo(doc.updated_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      status === 'Completed' ? 'bg-success/10 text-success' :
                      status === 'Active' ? 'bg-primary/10 text-primary' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {status}
                    </span>
                  </div>
                )
              })
            )}
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
            {templatesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates available yet.</p>
              </div>
            ) : (
              templates.slice(0, 4).map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{template.category}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {template.usage_count}
                      </span>
                      {template.is_premium && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Use Template
                  </Button>
                </div>
              ))
            )}
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