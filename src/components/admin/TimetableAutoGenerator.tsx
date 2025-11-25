import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TimetableComparisonDialog } from './TimetableComparisonDialog';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface GeneratorConfig {
  selectedClassId: string;
  periodsPerDay: number;
  daysPerWeek: number;
  minPeriodsPerSubject: number;
  maxPeriodsPerSubject: number;
  breakfastTime: string;
  lunchTime: string;
  shortBreakAfterPeriod: number;
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
  currentEntries: any[];
  classes: any[];
  subjects: any[];
  teachers: any[];
}

export function TimetableAutoGenerator({ 
  onGenerated, 
  currentEntries,
  classes: classesProp,
  subjects: subjectsProp,
  teachers: teachersProp,
}: TimetableAutoGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [proposedEntries, setProposedEntries] = useState<any[]>([]);
  const [config, setConfig] = useState<GeneratorConfig>({
    selectedClassId: '',
    periodsPerDay: 6,
    daysPerWeek: 6,
    minPeriodsPerSubject: 2,
    maxPeriodsPerSubject: 5,
    breakfastTime: '09:30',
    lunchTime: '12:00',
    shortBreakAfterPeriod: 3,
  });

  const generateTimetable = async () => {
    if (!config.selectedClassId) {
      toast({
        title: 'Error',
        description: 'Please select a class first',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      // Fetch selected class
      const { data: selectedClass, error: classError } = await supabase
        .from('classes')
        .select('class_id, class_name, section')
        .eq('class_id', config.selectedClassId)
        .single();
      
      if (classError) throw classError;

      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('subject_id, subject_name, class_id, teacher_id')
        .eq('class_id', config.selectedClassId);
      
      if (subjectsError) throw subjectsError;

      if (!subjects || subjects.length === 0) {
        throw new Error('No subjects found for this class');
      }

      // Generate timetable entries
      const timetableEntries: any[] = [];
      const teacherSchedule: Record<string, Set<string>> = {}; // teacher_id -> Set of "day-time" strings

      const days = DAYS.slice(0, config.daysPerWeek);
      const slots = TIME_SLOTS.slice(0, config.periodsPerDay);

      // Calculate periods needed per subject
      const totalNonBreakSlots = days.length * (slots.length - 2); // Reserve 2 slots for breaks per day
      const periodsPerSubject = Math.max(
        config.minPeriodsPerSubject,
        Math.min(
          config.maxPeriodsPerSubject,
          Math.floor(totalNonBreakSlots / subjects.length)
        )
      );

      // Create a pool of subjects with required periods
      const subjectPool: any[] = [];
      subjects.forEach(subject => {
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
        let periodCount = 0;
        for (const slot of slots) {
          periodCount++;

          // Insert breakfast break
          if (slot.start_time === config.breakfastTime) {
            timetableEntries.push({
              class_id: selectedClass.class_id,
              subject_id: subjects[0].subject_id, // Use first subject as placeholder
              teacher_id: null,
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_break: true,
              period_name: 'Breakfast Break',
            });
            continue;
          }

          // Insert lunch break
          if (slot.start_time === config.lunchTime) {
            timetableEntries.push({
              class_id: selectedClass.class_id,
              subject_id: subjects[0].subject_id, // Use first subject as placeholder
              teacher_id: null,
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_break: true,
              period_name: 'Lunch Break',
            });
            continue;
          }

          // Insert short break after configured period
          if (periodCount === config.shortBreakAfterPeriod) {
            timetableEntries.push({
              class_id: selectedClass.class_id,
              subject_id: subjects[0].subject_id, // Use first subject as placeholder
              teacher_id: null,
              day_of_week: day,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_break: true,
              period_name: 'Short Break',
            });
            continue;
          }

          if (subjectIndex >= subjectPool.length) break;

          const subject = subjectPool[subjectIndex];
          const timeKey = `${day}-${slot.start_time}-${slot.end_time}`;

          // Check if teacher is available at this time
          if (subject.teacher_id) {
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
            class_id: selectedClass.class_id,
            subject_id: subject.subject_id,
            teacher_id: subject.teacher_id,
            day_of_week: day,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_break: false,
          });

          subjectIndex++;
        }
      }

      // Show comparison dialog instead of directly inserting
      setProposedEntries(timetableEntries);
      setOpen(false);
      setComparisonOpen(true);
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

  const handleAcceptProposal = async () => {
    try {
      // Delete existing timetable
      await supabase.from('timetable').delete().neq('timetable_id', '00000000-0000-0000-0000-000000000000');

      // Insert proposed timetable
      if (proposedEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('timetable')
          .insert(proposedEntries);

        if (insertError) throw insertError;
      }

      const selectedClassName = classesProp.find(c => c.class_id === config.selectedClassId)?.class_name || 'selected class';
      
      toast({
        title: 'Success',
        description: `Applied ${proposedEntries.length} timetable entries for ${selectedClassName}`,
      });

      setComparisonOpen(false);
      setProposedEntries([]);
      onGenerated();
    } catch (error: any) {
      console.error('Error applying timetable:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply timetable',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRejectProposal = () => {
    setComparisonOpen(false);
    setProposedEntries([]);
    toast({
      title: 'Cancelled',
      description: 'Proposed timetable was not applied',
    });
  };

  return (
    <>
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
            Automatically create a complete weekly schedule for selected class with breaks, lunch, and optimized teacher allocation
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This will <strong>replace the existing timetable for the selected class</strong> with an auto-generated schedule including breaks.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="selectedClass">Select Class *</Label>
            <Select
              value={config.selectedClassId}
              onValueChange={(value) =>
                setConfig({ ...config, selectedClassId: value })
              }
            >
              <SelectTrigger id="selectedClass">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classesProp.map((classItem) => (
                  <SelectItem key={classItem.class_id} value={classItem.class_id}>
                    {classItem.class_name} {classItem.section && `- ${classItem.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="breakfastTime">Breakfast Break Time</Label>
            <Input
              id="breakfastTime"
              type="time"
              value={config.breakfastTime}
              onChange={(e) =>
                setConfig({ ...config, breakfastTime: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunchTime">Lunch Break Time</Label>
            <Input
              id="lunchTime"
              type="time"
              value={config.lunchTime}
              onChange={(e) =>
                setConfig({ ...config, lunchTime: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreak">Short Break After Period</Label>
            <Select
              value={config.shortBreakAfterPeriod.toString()}
              onValueChange={(value) =>
                setConfig({ ...config, shortBreakAfterPeriod: parseInt(value) })
              }
            >
              <SelectTrigger id="shortBreak">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    After {num} periods
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
          <Button 
            onClick={generateTimetable} 
            disabled={generating || !config.selectedClassId}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <TimetableComparisonDialog
      open={comparisonOpen}
      onOpenChange={setComparisonOpen}
      currentEntries={currentEntries}
      proposedEntries={proposedEntries}
      classes={classesProp}
      subjects={subjectsProp}
      teachers={teachersProp}
      onAccept={handleAcceptProposal}
      onReject={handleRejectProposal}
    />
    </>
  );
}
