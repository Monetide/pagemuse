import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  Save,
  Palette,
  Eye,
  Crown
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type Template = Tables<'templates'>

export default function AdminTemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    is_global: false,
    is_premium: false
  })

  useEffect(() => {
    if (id) {
      fetchTemplate()
    }
  }, [id])

  const fetchTemplate = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setTemplate(data)
      setFormData({
        name: data.name,
        description: data.description || '',
        category: data.category,
        is_global: data.is_global,
        is_premium: data.is_premium
      })
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          is_global: formData.is_global,
          is_premium: formData.is_premium
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Template updated successfully",
      })

      navigate('/admin/templates')
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Palette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Template not found</h3>
          <p className="text-muted-foreground mb-6">
            The template you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/admin/templates">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Palette className="w-8 h-8 text-primary" />
              Edit Template
            </h1>
            <p className="text-muted-foreground mt-1">
              Modify template settings and visibility
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic information about this template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Business, Marketing, Academic"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Configure template visibility and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_global" className="text-base">Global Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this template available to all users
                  </p>
                </div>
                <Switch
                  id="is_global"
                  checked={formData.is_global}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_global: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_premium" className="text-base">Premium Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Require premium access to use this template
                  </p>
                </div>
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Template Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={formData.is_global ? "default" : "secondary"}>
                  {formData.is_global ? 'Published' : 'Draft'}
                </Badge>
                {formData.is_premium && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage:</span>
                  <span>{template.usage_count} times</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gradient-to-br from-muted/50 to-muted rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <div className="text-center">
                  <Palette className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Preview</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}