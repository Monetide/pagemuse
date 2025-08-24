import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  ArrowLeft, 
  Activity,
  Plus,
  Edit,
  RefreshCw,
  RotateCcw,
  Layers,
  Clock,
  User,
  Diff
} from 'lucide-react';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface BrandActivity {
  id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
  };
}

const activityIcons = {
  brand_kit_created: Plus,
  brand_kit_updated: Edit,
  brand_kit_applied: RefreshCw,
  brand_kit_rollback: RotateCcw,
  brand_kit_bulk_apply: Layers,
};

const activityColors = {
  brand_kit_created: 'bg-green-100 text-green-700 border-green-200',
  brand_kit_updated: 'bg-blue-100 text-blue-700 border-blue-200',
  brand_kit_applied: 'bg-purple-100 text-purple-700 border-purple-200',
  brand_kit_rollback: 'bg-orange-100 text-orange-700 border-orange-200',
  brand_kit_bulk_apply: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export const WorkspaceBrandActivity = () => {
  const { currentWorkspace } = useWorkspaceContext();
  const [activities, setActivities] = useState<BrandActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      fetchBrandActivities();
    }
  }, [currentWorkspace]);

  const fetchBrandActivities = async () => {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('workspace_activities')
        .select(`
          id,
          activity_type,
          description,
          metadata,
          created_at,
          user_id
        `)
        .eq('workspace_id', currentWorkspace.id)
        .like('activity_type', 'brand_kit_%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get user profiles separately
      const userIds = [...new Set((data || []).map(activity => activity.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      const activitiesWithProfiles = (data || []).map(activity => ({
        ...activity,
        profiles: profiles?.find(p => p.user_id === activity.user_id)
      }));
      
      setActivities(activitiesWithProfiles as BrandActivity[]);
    } catch (error) {
      console.error('Error fetching brand activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type as keyof typeof activityIcons] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActivityColor = (type: string) => {
    return activityColors[type as keyof typeof activityColors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const renderDiffSummary = (diff: any) => {
    if (!diff || typeof diff !== 'object') return null;

    const changes: string[] = [];
    
    if (diff.palette) {
      const paletteChanges = Object.keys(diff.palette);
      if (paletteChanges.length > 0) {
        changes.push(`${paletteChanges.length} palette color${paletteChanges.length > 1 ? 's' : ''}`);
      }
    }
    
    if (diff.neutrals) {
      const neutralsChanges = Object.keys(diff.neutrals);
      if (neutralsChanges.length > 0) {
        changes.push(`${neutralsChanges.length} neutral color${neutralsChanges.length > 1 ? 's' : ''}`);
      }
    }
    
    if (diff.name) {
      changes.push('name');
    }
    
    if (diff.logo_primary_url || diff.logo_alt_url) {
      changes.push('logo');
    }

    if (changes.length === 0) return null;

    return (
      <div className="mt-2 p-2 rounded bg-muted/50 border">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
          <Diff className="w-3 h-3" />
          Changes:
        </div>
        <div className="text-xs text-muted-foreground">
          {changes.join(', ')}
        </div>
        {(diff.palette || diff.neutrals) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {diff.palette && Object.entries(diff.palette).map(([key, change]: [string, any]) => (
              <div key={key} className="flex items-center gap-1 text-xs">
                <span className="font-mono">{key}:</span>
                <div 
                  className="w-3 h-3 rounded border" 
                  style={{ backgroundColor: change.before }}
                  title={`Before: ${change.before}`}
                />
                <span>→</span>
                <div 
                  className="w-3 h-3 rounded border" 
                  style={{ backgroundColor: change.after }}
                  title={`After: ${change.after}`}
                />
              </div>
            ))}
            {diff.neutrals && Object.entries(diff.neutrals).map(([key, change]: [string, any]) => (
              <div key={key} className="flex items-center gap-1 text-xs">
                <span className="font-mono">{key}:</span>
                <div 
                  className="w-3 h-3 rounded border" 
                  style={{ backgroundColor: change.before }}
                  title={`Before: ${change.before}`}
                />
                <span>→</span>
                <div 
                  className="w-3 h-3 rounded border" 
                  style={{ backgroundColor: change.after }}
                  title={`After: ${change.after}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Brand Settings
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Brand Activity
          </h1>
          <p className="text-muted-foreground">
            Track all brand kit operations and changes in this workspace
          </p>
        </div>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Recent Brand Kit Activity
          </CardTitle>
          <CardDescription>
            All brand kit creation, edits, applications, and rollbacks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-full border ${getActivityColor(activity.activity_type)}`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {activity.profiles?.display_name || 'Unknown User'}
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            {activity.activity_type.replace('brand_kit_', '').replace('_', ' ')}
                          </Badge>
                          
                          {activity.metadata?.brand_kit_name && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.metadata.brand_kit_name}
                            </Badge>
                          )}
                        </div>

                        {/* Metadata Details */}
                        {activity.metadata && (
                          <div className="mt-2 space-y-1">
                            {activity.metadata.tokens_generated && (
                              <div className="text-xs text-muted-foreground">
                                Generated {activity.metadata.tokens_generated} color tokens
                              </div>
                            )}
                            
                            {activity.metadata.tokens_updated && (
                              <div className="text-xs text-muted-foreground">
                                Updated {activity.metadata.tokens_updated} color tokens
                              </div>
                            )}
                            
                            {activity.metadata.target_type && (
                              <div className="text-xs text-muted-foreground">
                                Applied to {activity.metadata.target_type}: {activity.metadata.target_id}
                              </div>
                            )}
                            
                            {activity.metadata.follow_updates !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Mode: {activity.metadata.follow_updates ? 'Follow Updates' : 'Detached'}
                              </div>
                            )}

                            {/* Diff Summary */}
                            {activity.metadata.diff && renderDiffSummary(activity.metadata.diff)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < activities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">No Brand Activity</h3>
              <p className="text-sm text-muted-foreground">
                Brand kit operations will appear here as they happen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};