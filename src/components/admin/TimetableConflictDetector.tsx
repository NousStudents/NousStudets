import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Coffee } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TimetableEntry {
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

interface Conflict {
  type: 'teacher_conflict' | 'no_break';
  severity: 'high' | 'medium';
  day: string;
  time: string;
  details: string;
  affectedClasses?: string[];
  teacherName?: string;
}

interface TimetableConflictDetectorProps {
  entries: TimetableEntry[];
  classes: any[];
  subjects: any[];
  teachers: any[];
}

export function TimetableConflictDetector({
  entries,
  classes,
  subjects,
  teachers,
}: TimetableConflictDetectorProps) {
  const conflicts = useMemo(() => {
    const detectedConflicts: Conflict[] = [];

    // Enrich entries with names
    const enrichedEntries = entries.map(entry => {
      const classItem = classes.find(c => c.class_id === entry.class_id);
      const subject = subjects.find(s => s.subject_id === entry.subject_id);
      const teacher = teachers.find(t => t.teacher_id === entry.teacher_id);
      
      return {
        ...entry,
        class_name: classItem ? `${classItem.class_name}${classItem.section ? ` - ${classItem.section}` : ''}` : 'Unknown',
        subject_name: subject?.subject_name || 'Unknown',
        teacher_name: teacher?.full_name || 'Unknown',
      };
    });

    // 1. Detect teacher conflicts (same teacher, same time, different classes)
    const teacherSchedule: Record<string, Map<string, TimetableEntry[]>> = {};

    enrichedEntries.forEach(entry => {
      if (!entry.teacher_id) return;

      if (!teacherSchedule[entry.teacher_id]) {
        teacherSchedule[entry.teacher_id] = new Map();
      }

      const timeKey = `${entry.day_of_week}-${entry.start_time}-${entry.end_time}`;
      if (!teacherSchedule[entry.teacher_id].has(timeKey)) {
        teacherSchedule[entry.teacher_id].set(timeKey, []);
      }

      teacherSchedule[entry.teacher_id].get(timeKey)!.push(entry);
    });

    // Check for teacher conflicts
    Object.entries(teacherSchedule).forEach(([teacherId, schedule]) => {
      schedule.forEach((entriesAtTime, timeKey) => {
        if (entriesAtTime.length > 1) {
          const [day, startTime, endTime] = timeKey.split('-');
          detectedConflicts.push({
            type: 'teacher_conflict',
            severity: 'high',
            day,
            time: `${startTime} - ${endTime}`,
            details: `${entriesAtTime[0].teacher_name} is scheduled for ${entriesAtTime.length} classes at the same time`,
            affectedClasses: entriesAtTime.map(e => e.class_name || 'Unknown'),
            teacherName: entriesAtTime[0].teacher_name,
          });
        }
      });
    });

    // 2. Detect no breaks (consecutive periods without gaps)
    const classSchedule: Record<string, Map<string, TimetableEntry[]>> = {};

    enrichedEntries.forEach(entry => {
      if (!classSchedule[entry.class_id]) {
        classSchedule[entry.class_id] = new Map();
      }

      if (!classSchedule[entry.class_id].has(entry.day_of_week)) {
        classSchedule[entry.class_id].set(entry.day_of_week, []);
      }

      classSchedule[entry.class_id].get(entry.day_of_week)!.push(entry);
    });

    // Check for no breaks
    Object.entries(classSchedule).forEach(([classId, schedule]) => {
      schedule.forEach((dayEntries, day) => {
        // Sort by start time
        const sorted = dayEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

        let consecutiveCount = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const current = sorted[i];

          // Check if current period starts exactly when previous ends
          if (prev.end_time === current.start_time) {
            consecutiveCount++;
            
            // If 4 or more consecutive periods without break
            if (consecutiveCount >= 4) {
              detectedConflicts.push({
                type: 'no_break',
                severity: 'medium',
                day,
                time: `${sorted[i - consecutiveCount + 1].start_time} - ${current.end_time}`,
                details: `${sorted[0].class_name} has ${consecutiveCount} consecutive periods without a break`,
                affectedClasses: [sorted[0].class_name || 'Unknown'],
              });
              consecutiveCount = 1; // Reset to avoid duplicate warnings
            }
          } else {
            consecutiveCount = 1;
          }
        }
      });
    });

    return detectedConflicts;
  }, [entries, classes, subjects, teachers]);

  const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;
  const mediumSeverityCount = conflicts.filter(c => c.severity === 'medium').length;

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen={highSeverityCount > 0}>
      <Alert variant={highSeverityCount > 0 ? 'destructive' : 'default'} className="border-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Timetable Conflicts Detected</span>
          <CollapsibleTrigger asChild>
            <Badge variant={highSeverityCount > 0 ? 'destructive' : 'secondary'} className="cursor-pointer">
              {highSeverityCount > 0 && `${highSeverityCount} Critical`}
              {highSeverityCount > 0 && mediumSeverityCount > 0 && ', '}
              {mediumSeverityCount > 0 && `${mediumSeverityCount} Warning${mediumSeverityCount > 1 ? 's' : ''}`}
            </Badge>
          </CollapsibleTrigger>
        </AlertTitle>
        <CollapsibleContent>
          <AlertDescription className="mt-3 space-y-3">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-md bg-background/50 border"
              >
                <div className="mt-0.5">
                  {conflict.type === 'teacher_conflict' ? (
                    <Users className="h-4 w-4 text-destructive" />
                  ) : (
                    <Coffee className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {conflict.day}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{conflict.time}</span>
                  </div>
                  <p className="text-sm font-medium">{conflict.details}</p>
                  {conflict.affectedClasses && conflict.affectedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {conflict.affectedClasses.map((className, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </AlertDescription>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
}
