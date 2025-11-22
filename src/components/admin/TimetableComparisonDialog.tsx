import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, X, Loader2 } from 'lucide-react';

interface TimetableEntry {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface TimetableComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEntries: TimetableEntry[];
  proposedEntries: TimetableEntry[];
  classes: any[];
  subjects: any[];
  teachers: any[];
  onAccept: () => Promise<void>;
  onReject: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimetableComparisonDialog({
  open,
  onOpenChange,
  currentEntries,
  proposedEntries,
  classes,
  subjects,
  teachers,
  onAccept,
  onReject,
}: TimetableComparisonDialogProps) {
  const [accepting, setAccepting] = useState(false);

  const enrichEntry = (entry: TimetableEntry) => {
    const classItem = classes.find(c => c.class_id === entry.class_id);
    const subject = subjects.find(s => s.subject_id === entry.subject_id);
    const teacher = teachers.find(t => t.teacher_id === entry.teacher_id);

    return {
      ...entry,
      class_name: classItem ? `${classItem.class_name}${classItem.section ? ` - ${classItem.section}` : ''}` : 'Unknown',
      subject_name: subject?.subject_name || 'Unknown',
      teacher_name: teacher?.full_name || 'Unknown',
    };
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  };

  const groupByClass = (entries: TimetableEntry[]) => {
    const grouped: Record<string, TimetableEntry[]> = {};
    entries.forEach(entry => {
      if (!grouped[entry.class_id]) {
        grouped[entry.class_id] = [];
      }
      grouped[entry.class_id].push(entry);
    });
    return grouped;
  };

  const currentGrouped = groupByClass(currentEntries);
  const proposedGrouped = groupByClass(proposedEntries);

  const allClassIds = Array.from(
    new Set([...Object.keys(currentGrouped), ...Object.keys(proposedGrouped)])
  );

  const renderTimetableGrid = (entries: TimetableEntry[], classId: string) => {
    const classEntries = entries.filter(e => e.class_id === classId);
    
    if (classEntries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No schedule</p>
        </div>
      );
    }

    const byDay: Record<string, TimetableEntry[]> = {};
    classEntries.forEach(entry => {
      if (!byDay[entry.day_of_week]) {
        byDay[entry.day_of_week] = [];
      }
      byDay[entry.day_of_week].push(entry);
    });

    return (
      <div className="space-y-3">
        {DAYS.map(day => {
          const dayEntries = byDay[day] || [];
          if (dayEntries.length === 0) return null;

          return (
            <div key={day} className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2">{day}</h4>
              <div className="space-y-1">
                {dayEntries
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((entry, idx) => {
                    const enriched = enrichEntry(entry);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {entry.start_time} - {entry.end_time}
                        </Badge>
                        <span className="font-medium">{enriched.subject_name}</span>
                        <span className="text-muted-foreground">• {enriched.teacher_name}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Compare Timetables
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Review the proposed auto-generated timetable before applying it. The current timetable will be replaced.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Tabs defaultValue={allClassIds[0] || ''} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {allClassIds.map(classId => {
                const classItem = classes.find(c => c.class_id === classId);
                return (
                  <TabsTrigger key={classId} value={classId}>
                    {classItem?.class_name || 'Unknown'}{' '}
                    {classItem?.section && `- ${classItem.section}`}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {allClassIds.map(classId => (
              <TabsContent key={classId} value={classId} className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Timetable */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Current Timetable
                        <Badge variant="outline">{currentGrouped[classId]?.length || 0} periods</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTimetableGrid(currentEntries, classId)}
                    </CardContent>
                  </Card>

                  {/* Proposed Timetable */}
                  <Card className="border-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        Proposed Timetable
                        <Badge>{proposedGrouped[classId]?.length || 0} periods</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTimetableGrid(proposedEntries, classId)}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject} disabled={accepting}>
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleAccept} disabled={accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Accept & Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
