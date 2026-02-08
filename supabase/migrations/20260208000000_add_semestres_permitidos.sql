-- Add semestres_permitidos column to palestras table
-- Stores a JSON array of allowed semesters (e.g. "[1,3,5]") or NULL for all semesters
ALTER TABLE palestras ADD COLUMN IF NOT EXISTS semestres_permitidos TEXT DEFAULT NULL;
