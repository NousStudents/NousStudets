-- Enable realtime for timetable table
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable;

-- Add helpful comment
COMMENT ON TABLE public.timetable IS 'Timetable entries with realtime sync enabled for instant updates across student and teacher apps';