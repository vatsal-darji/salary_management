CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   VARCHAR(255)   NOT NULL,
  job_title   VARCHAR(255)   NOT NULL,
  country     VARCHAR(100)   NOT NULL,
  salary      NUMERIC(12, 2) NOT NULL CHECK (salary >= 0),
  department  VARCHAR(255)   NOT NULL,
  email       VARCHAR(255)   NOT NULL UNIQUE,
  hire_date   DATE           NOT NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes for insight queries (country/job_title aggregations)
CREATE INDEX IF NOT EXISTS idx_employees_country        ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_job_title      ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_department     ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_country_job    ON employees(country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_salary         ON employees(salary);

-- Full-text search index on name
CREATE INDEX IF NOT EXISTS idx_employees_full_name_gin
  ON employees USING gin(to_tsvector('english', full_name));