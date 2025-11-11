import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BackButton } from "@/components/BackButton";

interface OrphanedUser {
  user_id: string;
  email: string;
  full_name: string;
  auth_user_id?: string;
  created_at: string;
  role: string;
  type: string;
  reason: string;
}

interface OrphanedAuthUser {
  auth_user_id: string;
  email: string;
  created_at: string;
  type: string;
  reason: string;
}

interface OrphansData {
  orphanedUsers: OrphanedUser[];
  orphanedAuthUsers: OrphanedAuthUser[];
  summary: {
    totalOrphanedUsers: number;
    totalOrphanedAuthUsers: number;
    total: number;
  };
}

export default function CleanupUtility() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orphansData, setOrphansData] = useState<OrphansData | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchOrphans = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-cleanup-orphans', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setOrphansData(data);
    } catch (error: any) {
      console.error('Error fetching orphaned records:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orphaned records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphans();
  }, [session]);

  const handleDelete = async (userId: string, type: string) => {
    if (!session) return;

    setDeleting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-cleanup-orphans', {
        body: { userId, type },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        method: 'POST',
      });

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cleanup-orphans`);
      url.searchParams.set('action', 'cleanup');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, type }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Orphaned record deleted successfully",
      });

      // Refresh the list
      fetchOrphans();
    } catch (error: any) {
      console.error('Error deleting orphaned record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete orphaned record",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleCleanupAll = async (type: 'users' | 'auth') => {
    if (!session) return;

    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cleanup-orphans`);
      url.searchParams.set('action', 'cleanup-all');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh the list
      fetchOrphans();
    } catch (error: any) {
      console.error('Error cleaning up all orphans:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup orphaned records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Database Cleanup Utility</h1>
            <p className="text-muted-foreground">View and remove orphaned user records</p>
          </div>
        </div>
        <Button onClick={fetchOrphans} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {orphansData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Orphans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orphansData.summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Orphaned Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orphansData.summary.totalOrphanedUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Orphaned Auth Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orphansData.summary.totalOrphanedAuthUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Warning: Deleting orphaned records is permanent and cannot be undone. Make sure you understand the implications before proceeding.
        </AlertDescription>
      </Alert>

      {/* Orphaned User Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orphaned User Records</CardTitle>
              <CardDescription>
                User records without valid authentication accounts
              </CardDescription>
            </div>
            {orphansData && orphansData.orphanedUsers.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup All Users
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {orphansData.orphanedUsers.length} orphaned user records.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCleanupAll('users')} className="bg-destructive text-destructive-foreground">
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orphansData && orphansData.orphanedUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orphansData.orphanedUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.type === 'user_without_auth' ? 'No Auth' : 'No Auth ID'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleting === user.user_id}
                          >
                            {deleting === user.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Orphaned User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user record for {user.email}.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(user.user_id, user.type)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No orphaned user records found</p>
          )}
        </CardContent>
      </Card>

      {/* Orphaned Auth Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orphaned Authentication Users</CardTitle>
              <CardDescription>
                Authentication accounts without corresponding user records
              </CardDescription>
            </div>
            {orphansData && orphansData.orphanedAuthUsers.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup All Auth Users
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {orphansData.orphanedAuthUsers.length} orphaned authentication accounts.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCleanupAll('auth')} className="bg-destructive text-destructive-foreground">
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orphansData && orphansData.orphanedAuthUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Auth User ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orphansData.orphanedAuthUsers.map((authUser) => (
                  <TableRow key={authUser.auth_user_id}>
                    <TableCell className="font-medium">{authUser.email}</TableCell>
                    <TableCell className="font-mono text-xs">{authUser.auth_user_id}</TableCell>
                    <TableCell>{new Date(authUser.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleting === authUser.auth_user_id}
                          >
                            {deleting === authUser.auth_user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Orphaned Auth User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the authentication account for {authUser.email}.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(authUser.auth_user_id, authUser.type)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No orphaned auth users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
