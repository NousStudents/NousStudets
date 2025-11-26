import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Calendar, User } from 'lucide-react';

interface LeaveRequest {
  leave_request_id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  students: {
    full_name: string;
    roll_no: string | null;
  };
}

interface LeaveRequestsSectionProps {
  classId: string;
}

export function LeaveRequestsSection({ classId }: LeaveRequestsSectionProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchLeaveRequests();
  }, [classId, filter]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          students (
            full_name,
            roll_no
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error: any) {
      toast.error('Failed to load leave requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('leave_request_id', requestId);

      if (error) throw error;

      toast.success(`Leave request ${status}`);
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error('Failed to update leave request');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests Management</CardTitle>
        <CardDescription>Review and approve/reject student leave applications</CardDescription>
        <div className="flex flex-wrap gap-2 pt-4">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div
                key={request.leave_request_id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{request.students.full_name}</span>
                      <Badge variant="outline">{request.students.roll_no || '-'}</Badge>
                      <Badge
                        variant={
                          request.status === 'pending'
                            ? 'secondary'
                            : request.status === 'approved'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(request.start_date), 'PP')} - {format(new Date(request.end_date), 'PP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-medium mb-1">Reason:</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request.leave_request_id, 'approved')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateRequestStatus(request.leave_request_id, 'rejected')}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Submitted: {format(new Date(request.created_at), 'PPp')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
