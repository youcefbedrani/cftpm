-- ============================================================================
-- CFTMP — Full Supabase Setup
-- Copy and paste this entire file into Supabase SQL Editor, then click Run.
-- Safe to re-run: every table is dropped first.
-- ============================================================================

DROP TABLE IF EXISTS meeting_invitations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS course_instructors CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== PROFILES =====
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','formateur','admin')),
  phone         TEXT DEFAULT '',
  wilaya        TEXT DEFAULT '',
  bio           TEXT DEFAULT '',
  expertise     TEXT DEFAULT '',
  enrolled_ids  JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX profiles_role_idx ON profiles (role);

-- ===== CUSTOM COURSE REQUESTS =====
CREATE TABLE requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic       TEXT NOT NULL,
  level       TEXT DEFAULT 'Beginner',
  message     TEXT DEFAULT '',
  user_email  TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX requests_status_idx ON requests (status);

-- ===== ENROLLMENTS =====
CREATE TABLE enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    INT NOT NULL,
  course_title TEXT NOT NULL,
  user_email   TEXT NOT NULL,
  user_name    TEXT NOT NULL,
  phone        TEXT DEFAULT '',
  wilaya       TEXT DEFAULT '',
  motivation   TEXT DEFAULT '',
  amount       INT NOT NULL,
  paid_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX enrollments_user_idx   ON enrollments (user_email);
CREATE INDEX enrollments_course_idx ON enrollments (course_id);

-- ===== COURSE <-> INSTRUCTOR ASSIGNMENT =====
CREATE TABLE course_instructors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        INT NOT NULL,
  instructor_email TEXT NOT NULL,
  assigned_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (course_id, instructor_email)
);
CREATE INDEX ci_instructor_idx ON course_instructors (instructor_email);

-- ===== LESSONS =====
CREATE TABLE lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         INT NOT NULL,
  order_num         INT NOT NULL DEFAULT 1,
  title             TEXT NOT NULL,
  content           TEXT DEFAULT '',
  video_url         TEXT DEFAULT '',
  duration_min      INT DEFAULT 0,
  created_by_email  TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX lessons_course_idx ON lessons (course_id, order_num);

-- ===== STUDENT LESSON PROGRESS =====
CREATE TABLE lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT NOT NULL,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id    INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_email, lesson_id)
);
CREATE INDEX lp_user_course_idx ON lesson_progress (user_email, course_id);

-- ===== ANNOUNCEMENTS =====
CREATE TABLE announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     INT NOT NULL,
  author_email  TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX announcements_course_idx ON announcements (course_id);

-- ===== MESSAGES =====
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   INT NOT NULL,
  from_email  TEXT NOT NULL,
  from_name   TEXT NOT NULL,
  to_email    TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX messages_thread_idx ON messages (course_id, from_email, to_email, created_at);
CREATE INDEX messages_to_idx     ON messages (to_email);

-- ===== PAYMENTS / INVOICES =====
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  invoice_number  TEXT UNIQUE NOT NULL,
  amount          INT NOT NULL,
  currency        TEXT DEFAULT 'DZD',
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','processing','completed','failed')),
  payment_method  TEXT DEFAULT 'SlickPay',
  user_email      TEXT NOT NULL,
  user_name       TEXT NOT NULL,
  course_id       INT NOT NULL,
  course_title    TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  paid_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX payments_user_idx   ON payments (user_email);
CREATE INDEX payments_course_idx ON payments (course_id);

-- ===== MEETING INVITATIONS =====
CREATE TABLE meeting_invitations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         INT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '',
  meeting_date      TIMESTAMPTZ NOT NULL,
  meeting_link      TEXT NOT NULL,
  created_by_email  TEXT NOT NULL,
  created_by_name   TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX mi_course_idx ON meeting_invitations (course_id);

-- ============================================================================
-- SEED DATA — 3 accounts (admin, formateur, student)
-- ============================================================================

INSERT INTO profiles (name, email, password_hash, role) VALUES
  ('CFTMP Admin',    'admin@cftmp.com',     '$2a$10$Wf7FA89eH2UkZLnJXjsq7eskZrDLpoRKBIkz/tFhw6Ntmfs8NJZoe', 'admin'),
  ('Ahmed Formateur','formateur@cftmp.com', '$2a$10$btiqUP78Yt3sOWDhoW43AekEO1vw81724d4YCYTX8EuydvO13.H3G', 'formateur'),
  ('Samir Student',  'student@cftmp.com',   '$2a$10$uK6uYZq4PBS2uXacwkIjUOBdjgHAAG1RfwH23q6gyb87WrVLl1wUm', 'student')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;
