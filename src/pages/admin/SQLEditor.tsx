import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, PlayCircle, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';

export default function SQLEditor() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [affectedRows, setAffectedRows] = useState<number | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setAffectedRows(null);

    try {
      // Use the database function to execute SQL
      const { data, error: queryError } = await supabase.rpc('execute_sql_query', {
        query_text: query
      });

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Parse the results
      const results = data || [];
      
      if (Array.isArray(results) && results.length > 0) {
        setResults(results);
        toast.success(`Query executed successfully. ${results.length} rows returned.`);
      } else if (Array.isArray(results) && results.length === 0) {
        setResults([]);
        toast.success('Query executed successfully but returned no rows.');
      } else {
        setAffectedRows(1);
        toast.success('Query executed successfully');
      }

      // Add to history
      setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while executing the query';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults(null);
    setError(null);
    setAffectedRows(null);
  };

  const loadFromHistory = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-3xl font-bold text-foreground mt-4">SQL Query Editor</h1>
            <p className="text-muted-foreground mt-2">Execute SQL queries directly on your database</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Direct SQL queries can modify or delete your data. Use with caution and always backup important data before running destructive queries.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="editor">
              <Database className="h-4 w-4 mr-2" />
              Query Editor
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SQL Query</CardTitle>
                <CardDescription>Write your SQL query below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="SELECT * FROM students WHERE status = 'active';"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={executeQuery} disabled={loading}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Executing...' : 'Execute Query'}
                  </Button>
                  <Button onClick={clearQuery} variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {affectedRows !== null && (
              <Alert>
                <AlertDescription>
                  Query executed successfully. Affected rows: {affectedRows}
                </AlertDescription>
              </Alert>
            )}

            {results && results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                  <CardDescription>{results.length} rows returned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(results[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row, idx) => (
                          <TableRow key={idx}>
                            {Object.values(row).map((value: any, cellIdx) => (
                              <TableCell key={cellIdx}>
                                {value === null ? '(null)' : String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {results && results.length === 0 && (
              <Alert>
                <AlertDescription>Query executed successfully but returned no rows.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Query History</CardTitle>
                <CardDescription>Your recent queries</CardDescription>
              </CardHeader>
              <CardContent>
                {queryHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No query history yet</p>
                ) : (
                  <div className="space-y-2">
                    {queryHistory.map((historicalQuery, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => loadFromHistory(historicalQuery)}
                      >
                        <code className="text-xs break-all">{historicalQuery}</code>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <Card>
              <CardHeader>
                <CardTitle>Example Queries</CardTitle>
                <CardDescription>Common SQL queries to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">View All Students</h4>
                    <code
                      className="block p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => setQuery('SELECT * FROM students LIMIT 10;')}
                    >
                      SELECT * FROM students LIMIT 10;
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">View All Teachers</h4>
                    <code
                      className="block p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => setQuery('SELECT * FROM teachers LIMIT 10;')}
                    >
                      SELECT * FROM teachers LIMIT 10;
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Count Students by Class</h4>
                    <code
                      className="block p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => setQuery('SELECT c.class_name, COUNT(s.student_id) as student_count FROM classes c LEFT JOIN students s ON c.class_id = s.class_id GROUP BY c.class_name;')}
                    >
                      SELECT c.class_name, COUNT(s.student_id) as student_count FROM classes c LEFT JOIN students s ON c.class_id = s.class_id GROUP BY c.class_name;
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Update Student Status</h4>
                    <code
                      className="block p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => setQuery("UPDATE students SET status = 'active' WHERE student_id = 'your-student-id';")}
                    >
                      UPDATE students SET status = 'active' WHERE student_id = 'your-student-id';
                    </code>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">View All Tables</h4>
                    <code
                      className="block p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => setQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")}
                    >
                      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
