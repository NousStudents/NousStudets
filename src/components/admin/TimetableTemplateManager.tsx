import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, FolderOpen, Trash2, Loader2, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TimetableEntry {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Template {
  template_id: string;
  template_name: string;
  description: string | null;
  created_at: string;
  metadata: any;
  configuration: any; // JSONB type from database
}

interface TimetableTemplateManagerProps {
  currentTimetable: TimetableEntry[];
  onLoadTemplate: (entries: TimetableEntry[]) => void;
}

export function TimetableTemplateManager({
  currentTimetable,
  onLoadTemplate,
}: TimetableTemplateManagerProps) {
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
  });

  useEffect(() => {
    if (loadDialogOpen) {
      fetchTemplates();
    }
  }, [loadDialogOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timetable_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.template_name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive',
      });
      return;
    }

    if (currentTimetable.length === 0) {
      toast({
        title: 'Error',
        description: 'No timetable data to save',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: schoolData } = await supabase
        .from('admins')
        .select('school_id, admin_id')
        .single();

      if (!schoolData) {
        throw new Error('Could not fetch school information');
      }

      const { error } = await supabase.from('timetable_templates').insert([{
        template_name: formData.template_name.trim(),
        description: formData.description.trim() || null,
        school_id: schoolData.school_id,
        created_by: schoolData.admin_id,
        configuration: currentTimetable as any,
        metadata: {
          total_entries: currentTimetable.length,
          saved_at: new Date().toISOString(),
        } as any,
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Template "${formData.template_name}" saved successfully`,
      });

      setSaveDialogOpen(false);
      setFormData({ template_name: '', description: '' });
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (template: Template) => {
    onLoadTemplate(template.configuration as TimetableEntry[]);
    setLoadDialogOpen(false);
    toast({
      title: 'Success',
      description: `Template "${template.template_name}" loaded successfully`,
    });
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('timetable_templates')
        .delete()
        .eq('template_id', templateToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });

      setTemplates(templates.filter(t => t.template_id !== templateToDelete));
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Timetable Template</DialogTitle>
            <DialogDescription>
              Save the current timetable configuration as a reusable template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                placeholder="e.g., Spring 2024 Schedule"
                value={formData.template_name}
                onChange={(e) =>
                  setFormData({ ...formData, template_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this template..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                This template will save <strong>{currentTimetable.length}</strong> timetable
                entries
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Load Timetable Template</DialogTitle>
            <DialogDescription>
              Choose a saved template to load into the current timetable
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">No templates found</p>
                <p className="text-sm text-muted-foreground">
                  Save your first timetable template to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {template.template_name}
                          </CardTitle>
                          {template.description && (
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {Array.isArray(template.configuration) ? template.configuration.length : 0} entries
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoad(template)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setTemplateToDelete(template.template_id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
