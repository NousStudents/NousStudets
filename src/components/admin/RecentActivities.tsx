import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Search, UserPlus, BookOpen, FileText, CheckCircle, LogIn, Bell, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  activity_id: string;
  actor_name: string | null;
  actor_role: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
  metadata: any;
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities' },
  { value: 'registration', label: 'Registrations' },
  { value: 'enrollment', label: 'Enrollments' },
  { value: 'submission', label: 'Submissions' },
  { value: 'grading', label: 'Grading' },
  { value: 'profile_update', label: 'Profile Updates' },
  { value: 'login', label: 'Logins' },
  { value: 'notification', label: 'Notifications' },
  { value: 'exam', label: 'Exams' },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'registration':
      return <UserPlus className="w-4 h-4" />;
    case 'enrollment':
      return <BookOpen className="w-4 h-4" />;
    case 'submission':
      return <FileText className="w-4 h-4" />;
    case 'grading':
      return <CheckCircle className="w-4 h-4" />;
    case 'login':
      return <LogIn className="w-4 h-4" />;
    case 'notification':
      return <Bell className="w-4 h-4" />;
    case 'exam':
      return <Calendar className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'registration':
      return 'bg-pastel-blue/20 text-pastel-blue-dark';
    case 'enrollment':
      return 'bg-pastel-green/20 text-pastel-green-dark';
    case 'submission':
      return 'bg-pastel-purple/20 text-pastel-purple-dark';
    case 'grading':
      return 'bg-pastel-yellow/20 text-pastel-yellow-dark';
    case 'login':
      return 'bg-pastel-pink/20 text-pastel-pink-dark';
    case 'notification':
      return 'bg-accent/20 text-accent-foreground';
    case 'exam':
      return 'bg-pastel-blue/20 text-pastel-blue-dark';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const RecentActivities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const ITEMS_PER_PAGE = 15;

  const fetchActivities = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      }

      const currentPage = loadMore ? page + 1 : 1;
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('activity_type', filterType);
      }

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (dateRange) {
          case '24hours':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,actor_name.ilike.%${searchQuery}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      if (loadMore) {
        setActivities(prev => [...prev, ...(data || [])]);
        setPage(currentPage);
      } else {
        setActivities(data || []);
        setPage(1);
      }

      setHasMore((count || 0) > (currentPage * ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load activities. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filterType, dateRange, searchQuery]);

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          setActivities(prev => [payload.new as Activity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    fetchActivities();
    toast({
      title: 'Refreshed',
      description: 'Activities updated successfully.',
    });
  };

  const handleLoadMore = () => {
    fetchActivities(true);
  };

  if (loading && activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Loading recent events...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Track user and system events</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || filterType !== 'all'
                ? 'No activities match your filters. Try adjusting your search.'
                : 'Activities will appear here as users interact with the system.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.activity_type)}`}>
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm leading-tight">{activity.title}</h4>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {activity.activity_type}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {activity.actor_name && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{activity.actor_name}</span>
                        {activity.actor_role && (
                          <span className="text-muted-foreground/70">({activity.actor_role})</span>
                        )}
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
