import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Activity,
  Plus,
  Edit,
  RefreshCw,
  RotateCcw,
  Clock,
  User,
  Diff
} from 'lucide-react';
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

interface DocumentBrandActivityProps {
  documentId: string;
}

const activityIcons = {
  brand_kit_applied: RefreshCw,
  brand_kit_rollback: RotateCcw,
};

const activityColors = {
  brand_kit_applied: 'bg-purple-100 text-purple-700 border-purple-200',
  brand_kit_rollback: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const DocumentBrandActivity = ({ documentId }: DocumentBrandActivityProps) => {
  const [activities, setActivities] = useState<BrandActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchDocumentBrandActivities();
    }
  }, [documentId]);

  const fetchDocumentBrandActivities = async () => {
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
        .like('activity_type', 'brand_kit_%')
        .contains('metadata', { target_id: documentId })
        .order('created_at', { ascending: false })
        .limit(20);

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
      console.error('Error fetching document brand activities:', error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4" />
            Brand Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4" />
            Brand Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Brand kit operations for this document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Palette className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-xs text-muted-foreground">
              No brand kit activity yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="w-4 h-4" />
          Brand Activity
        </CardTitle>
        <CardDescription className="text-xs">
          Recent brand kit operations for this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div className={`p-1.5 rounded-full border ${getActivityColor(activity.activity_type)}`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {activity.profiles?.display_name || 'Unknown User'}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Metadata */}
                    {activity.metadata?.brand_kit_name && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {activity.metadata.brand_kit_name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {index < activities.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};