

-- 7. Add party_b_address column for Speed Post dispatch
ALTER TABLE cases ADD COLUMN IF NOT EXISTS party_b_address text;

-- 8. Party B response fields
ALTER TABLE cases ADD COLUMN IF NOT EXISTS party_b_response text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS party_b_responded_at timestamptz;

-- 9. New status values supported: 'mediation', 'contested'
--    (no schema change needed — status is a text column)
