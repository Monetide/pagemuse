import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { 
  Clock,
  User,
  Users,
  Settings,
  FileText,
  Palette,
  UserPlus,
  UserMinus,
  Crown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

const activityIcons = {
  workspace_created: Settings,
  workspace_renamed: Settings,
  member_invited: UserPlus,
  member_removed: UserMinus,
  member_role_changed: Crown,
  template_imported: Palette,
  document_created: FileText,
};

const activityColors = {
  workspace_created: 'bg-blue-500',
  workspace_renamed: 'bg-yellow-500',
  member_invited: 'bg-green-500',
  member_removed: 'bg-red-500',
  member_role_changed: 'bg-purple-500',
  template_imported: 'bg-indigo-500',
  document_created: 'bg-emerald-500',
};

export const WorkspaceActivityLog = () => {
  const { currentWorkspace } = useWorkspaceContext();
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [currentWorkspace]);

  const fetchActivities = async () => {
    if (!currentWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('workspace_activities')
        .select(`
          id,
          workspace_id,
          user_id,
          activity_type,
          description,
          metadata,
          created_at
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch profiles separately
      const activitiesWithProfiles = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', activity.user_id)
            .single();
          
          return {
            ...activity,
            profiles: profile
          };
        })
      );
      
      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const IconComponent = activityIcons[type as keyof typeof activityIcons] || Clock;
    return IconComponent;
  };

  const getActivityColor = (type: string) => {
    return activityColors[type as keyof typeof activityColors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent workspace activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Recent workspace activities ({activities.length} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No activities yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspace activities will appear here as they happen.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.activity_type);
                const colorClass = getActivityColor(activity.activity_type);
                
                return (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {activity.profiles?.display_name || 'Unknown user'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < activities.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};