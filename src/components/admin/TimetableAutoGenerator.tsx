import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface GeneratorConfig {
  periodsPerDay: number;
  daysPerWeek: number;
  minPeriodsPerSubject: number;
  maxPeriodsPerSubject: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS: TimeSlot[] = [
  { start_time: '08:00', end_time: '09:00' },
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '12:00', end_time: '13:00' },
  { start_time: '13:00', end_time: '14:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' },
];

interface TimetableAutoGeneratorProps {
  onGenerated: () => void;
}

export function TimetableAutoGenerator({ onGenerated }: TimetableAutoGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<GeneratorConfig>({
    periodsPerDay: 6,
    daysPerWeek: 6,
    minPeriodsPerSubject: 2,
    maxPeriodsPerSubject: 5,
  });

  const generateTimetable = async () => {
    setGenerating(true);
    try {
      // Fetch all classes with their subjects
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('class_id, class_name, section');
      
      if (classesError) throw classesError;

      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('subject_id, subject_name, class_id, teacher_id');
      
      if (subjectsError) throw subjectsError;

      // Group subjects by class
      const classBySubjects: Record<string, any[]> = {};
      subjects?.forEach(subject => {
        if (!classBySubjects[subject.class_id]) {
          classBySubjects[subject.class_id] = [];
        }
        classBySubjects[subject.class_id].push(subject);
      });

      // Generate timetable entries
      const timetableEntries: any[] = [];
      const teacherSchedule: Record<string, Set<string>> = {}; // teacher_id -> Set of "day-time" strings

      const days = DAYS.slice(0, config.daysPerWeek);
      const slots = TIME_SLOTS.slice(0, config.periodsPerDay);

      for (const classItem of classes || []) {
        const classSubjects = classBySubjects[classItem.class_id] || [];
        
        if (classSubjects.length === 0) continue;

        // Calculate periods needed per subject
        const totalSlots = days.length * slots.length;
        const periodsPerSubject = Math.max(
          config.minPeriodsPerSubject,
          Math.min(
            config.maxPeriodsPerSubject,
            Math.floor(totalSlots / classSubjects.length)
          )
        );

        // Create a pool of subjects with required periods
        const subjectPool: any[] = [];
        classSubjects.forEach(subject => {
          for (let i = 0; i < periodsPerSubject; i++) {
            subjectPool.push(subject);
          }
        });

        // Shuffle the pool for random distribution
        for (let i = subjectPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [subjectPool[i], subjectPool[j]] = [subjectPool[j], subjectPool[i]];
        }

        let subjectIndex = 0;

        // Assign subjects to time slots
        for (const day of days) {
          for (const slot of slots) {
            if (subjectIndex >= subjectPool.length) break;

            const subject = subjectPool[subjectIndex];
            const timeKey = `${day}-${slot.start_time}-${slot.end_time}`;

            // Check if teacher is available at this time
            if (subject.teacher_id) {
              const teacherKey = `${subject.teacher_id}-${timeKey}`;
              if (!teacherSchedule[subject.teacher_id]) {
                teacherSchedule[subject.teacher_id] = new Set();
              }

              // If teacher is busy, try to find another subject with available teacher
              if (teacherSchedule[subject.teacher_id].has(timeKey)) {
                let foundAlternative = false;
                for (let i = subjectIndex + 1; i < subjectPool.length; i++) {
                  const altSubject = subjectPool[i];
                  if (
                    !altSubject.teacher_id ||
                    !teacherSchedule[altSubject.teacher_id]?.has(timeKey)
                  ) {
                    // Swap subjects
                    [subjectPool[subjectIndex], subjectPool[i]] = [subjectPool[i], subjectPool[subjectIndex]];
                    foundAlternative = true;
                    break;
                  }
                }
                if (!foundAlternative) {
                  subjectIndex++;
                  continue; // Skip this slot if no alternative found
                }
              }

              teacherSchedule[subject.teacher_id].add(timeKey);
            }

            timetableEntries.push({
              class_id: classItem.class_id,
              subject_id: subject.subject_id,
              teacher_id: subject.teacher_id,
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
            });

            subjectIndex++;
          }
        }
      }

      // Delete existing timetable
      await supabase.from('timetable').delete().neq('timetable_id', '00000000-0000-0000-0000-000000000000');

      // Insert generated timetable
      if (timetableEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('timetable')
          .insert(timetableEntries);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: `Generated ${timetableEntries.length} timetable entries across ${classes?.length || 0} classes`,
      });

      setOpen(false);
      onGenerated();
    } catch (error: any) {
      console.error('Error generating timetable:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate timetable',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Auto Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Automatic Timetable Generator</DialogTitle>
          <DialogDescription>
            Automatically create a complete weekly schedule for all classes based on their subjects and teachers
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This will <strong>replace the entire existing timetable</strong> with a new auto-generated schedule.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="periodsPerDay">Periods per Day</Label>
            <Select
              value={config.periodsPerDay.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, periodsPerDay: parseInt(value) })
              }
            >
              <SelectTrigger id="periodsPerDay">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} periods
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daysPerWeek">Working Days per Week</Label>
            <Select
              value={config.daysPerWeek.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, daysPerWeek: parseInt(value) })
              }
            >
              <SelectTrigger id="daysPerWeek">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minPeriods">Min Periods per Subject (weekly)</Label>
            <Input
              id="minPeriods"
              type="number"
              min="1"
              max="10"
              value={config.minPeriodsPerSubject}
              onChange={(e) =>
                setConfig({ ...config, minPeriodsPerSubject: parseInt(e.target.value) || 1 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPeriods">Max Periods per Subject (weekly)</Label>
            <Input
              id="maxPeriods"
              type="number"
              min="1"
              max="15"
              value={config.maxPeriodsPerSubject}
              onChange={(e) =>
                setConfig({ ...config, maxPeriodsPerSubject: parseInt(e.target.value) || 5 })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={generateTimetable} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
