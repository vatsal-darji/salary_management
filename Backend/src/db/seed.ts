import { pool } from "./pool";
import { from as copyFrom } from "pg-copy-streams";

// ─── Reference data ──────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah",
  "Thomas", "Karen", "Charles", "Lisa", "Christopher", "Nancy", "Daniel", "Betty",
  "Matthew", "Margaret", "Anthony", "Sandra", "Mark", "Ashley", "Donald", "Dorothy",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah",
  "Timothy", "Stephanie", "Ronald", "Rebecca", "Edward", "Sharon", "Jason", "Laura",
  "Jeffrey", "Cynthia", "Ryan", "Kathleen", "Jacob", "Amy", "Gary", "Angela",
  "Nicholas", "Shirley", "Eric", "Anna", "Jonathan", "Brenda", "Stephen", "Pamela",
  "Larry", "Emma", "Justin", "Nicole", "Scott", "Helen", "Brandon", "Samantha",
  "Arjun", "Priya", "Ravi", "Ananya", "Vikram", "Deepa", "Aditya", "Pooja",
  "Wei", "Mei", "Chen", "Fang", "Hao", "Xin", "Jing", "Yun",
  "Ahmed", "Fatima", "Omar", "Aisha", "Khalid", "Nour", "Hassan", "Sara",
  "Carlos", "Maria", "Luis", "Ana", "Jorge", "Sofia", "Miguel", "Carmen",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
  "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
  "Campbell", "Mitchell", "Carter", "Roberts", "Patel", "Shah", "Kumar", "Sharma",
  "Singh", "Gupta", "Mehta", "Kapoor", "Bose", "Iyer", "Reddy", "Nair",
  "Zhang", "Wang", "Li", "Liu", "Chen", "Yang", "Huang", "Zhou",
  "Al-Hassan", "Al-Rashid", "Al-Amin", "Mansour", "Khalil", "Aziz",
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer",
  "Dupont", "Fontaine", "Bernard", "Petit", "Leroy", "Moreau",
];

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing", "Sales",
  "Finance", "Human Resources", "Operations", "Legal", "Data Science",
];

const JOB_TITLES_BY_DEPT: Record<string, { title: string; minSal: number; maxSal: number }[]> = {
  Engineering: [
    { title: "Software Engineer",        minSal: 70000,  maxSal: 150000 },
    { title: "Senior Software Engineer", minSal: 110000, maxSal: 200000 },
    { title: "Staff Engineer",           minSal: 160000, maxSal: 260000 },
    { title: "DevOps Engineer",          minSal: 80000,  maxSal: 160000 },
    { title: "QA Engineer",              minSal: 60000,  maxSal: 120000 },
  ],
  Product: [
    { title: "Product Manager",          minSal: 90000,  maxSal: 180000 },
    { title: "Senior Product Manager",   minSal: 130000, maxSal: 220000 },
    { title: "Product Analyst",          minSal: 65000,  maxSal: 110000 },
  ],
  Design: [
    { title: "UX Designer",              minSal: 65000,  maxSal: 130000 },
    { title: "Senior UX Designer",       minSal: 100000, maxSal: 170000 },
    { title: "UI Designer",              minSal: 60000,  maxSal: 120000 },
  ],
  Marketing: [
    { title: "Marketing Manager",        minSal: 70000,  maxSal: 140000 },
    { title: "Content Strategist",       minSal: 55000,  maxSal: 100000 },
    { title: "SEO Specialist",           minSal: 50000,  maxSal: 95000  },
    { title: "Growth Manager",           minSal: 80000,  maxSal: 150000 },
  ],
  Sales: [
    { title: "Account Executive",        minSal: 60000,  maxSal: 130000 },
    { title: "Sales Manager",            minSal: 90000,  maxSal: 180000 },
    { title: "Sales Development Rep",    minSal: 45000,  maxSal: 80000  },
  ],
  Finance: [
    { title: "Financial Analyst",        minSal: 65000,  maxSal: 120000 },
    { title: "Senior Financial Analyst", minSal: 90000,  maxSal: 160000 },
    { title: "Controller",               minSal: 110000, maxSal: 200000 },
    { title: "Accountant",               minSal: 50000,  maxSal: 90000  },
  ],
  "Human Resources": [
    { title: "HR Manager",               minSal: 70000,  maxSal: 130000 },
    { title: "HR Business Partner",      minSal: 75000,  maxSal: 140000 },
    { title: "Recruiter",                minSal: 55000,  maxSal: 100000 },
  ],
  Operations: [
    { title: "Operations Manager",       minSal: 80000,  maxSal: 150000 },
    { title: "Operations Analyst",       minSal: 55000,  maxSal: 100000 },
    { title: "Supply Chain Manager",     minSal: 85000,  maxSal: 155000 },
  ],
  Legal: [
    { title: "Legal Counsel",            minSal: 120000, maxSal: 250000 },
    { title: "Paralegal",                minSal: 50000,  maxSal: 90000  },
    { title: "Compliance Officer",       minSal: 80000,  maxSal: 150000 },
  ],
  "Data Science": [
    { title: "Data Scientist",           minSal: 90000,  maxSal: 175000 },
    { title: "Senior Data Scientist",    minSal: 130000, maxSal: 230000 },
    { title: "ML Engineer",              minSal: 100000, maxSal: 200000 },
    { title: "Data Analyst",             minSal: 60000,  maxSal: 110000 },
  ],
};

const COUNTRIES = [
  "United States", "United States", "United States", "United States",
  "India", "India", "India",
  "United Kingdom", "United Kingdom",
  "Canada", "Canada",
  "Germany", "France", "Australia",
  "Singapore", "Brazil", "Netherlands", "Poland", "Mexico",
];

// ─── Secondary indexes to drop before load and recreate after ────────────────
// Dropping them before COPY eliminates per-row index maintenance during the
// bulk load. Rebuilding once at the end is far cheaper than 10k incremental
// updates. The GIN index (full-text search) is the most expensive to maintain
// per-row, so the win is most pronounced there.

const SECONDARY_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_employees_country        ON employees(country);
  CREATE INDEX IF NOT EXISTS idx_employees_job_title      ON employees(job_title);
  CREATE INDEX IF NOT EXISTS idx_employees_department     ON employees(department);
  CREATE INDEX IF NOT EXISTS idx_employees_country_job    ON employees(country, job_title);
  CREATE INDEX IF NOT EXISTS idx_employees_salary         ON employees(salary);
  CREATE INDEX IF NOT EXISTS idx_employees_full_name_gin
    ON employees USING gin(to_tsvector('english', full_name));
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end   = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

// Fisher-Yates shuffle — produces a random permutation in-place
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pre-build a shuffled grid of every (first, last) pair up to `total`.
// This guarantees uniqueness with zero retry loops — each combination is
// visited at most once, so email collisions are impossible by construction.
function buildNameGrid(total: number): { full: string; email: string }[] {
  const pairs: { full: string; email: string }[] = [];
  for (const first of FIRST_NAMES) {
    for (const last of LAST_NAMES) {
      const clean = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
      pairs.push({ full: `${first} ${last}`, email: `${clean}@example.com` });
      if (pairs.length >= total) break;
    }
    if (pairs.length >= total) break;
  }
  // If first×last grid is smaller than total, cycle through with numeric suffix
  let extra = 0;
  while (pairs.length < total) {
    const first = FIRST_NAMES[extra % FIRST_NAMES.length];
    const last  = LAST_NAMES[Math.floor(extra / FIRST_NAMES.length) % LAST_NAMES.length];
    const clean = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
    pairs.push({ full: `${first} ${last}`, email: `${clean}.${extra}@example.com` });
    extra++;
  }
  return shuffle(pairs);
}

// Build a single Buffer for a batch of rows.
// Writing one large Buffer per 500 rows is far cheaper than 500 tiny writes
// because it minimises libuv event-loop round-trips into the stream internals.
const BATCH_SIZE = 500;

function buildBatch(
  names: { full: string; email: string }[],
  start: number,
  end: number,
): Buffer {
  const parts: string[] = [];
  for (let i = start; i < end; i++) {
    const { full, email } = names[i];
    const dept   = DEPARTMENTS[randInt(0, DEPARTMENTS.length - 1)];
    const role   = JOB_TITLES_BY_DEPT[dept][randInt(0, JOB_TITLES_BY_DEPT[dept].length - 1)];
    const salary = randInt(role.minSal, role.maxSal);
    const country = COUNTRIES[randInt(0, COUNTRIES.length - 1)];
    const hireDate = randDate(2010, 2024);
    parts.push(`${full}\t${role.title}\t${country}\t${salary}\t${dept}\t${email}\t${hireDate}\n`);
  }
  return Buffer.from(parts.join(""), "utf8");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed(total = 10_000): Promise<void> {
  const t0 = Date.now();
  const client = await pool.connect();

  try {
    // Phase 1: clear table and drop secondary indexes before the bulk load.
    // TRUNCATE is instant (no row-by-row delete). Dropping indexes here means
    // the COPY below only maintains the PK — the cheapest possible write path.
    process.stdout.write("  Truncating table and dropping indexes… ");
    let t = Date.now();
    await client.query(`
      TRUNCATE TABLE employees RESTART IDENTITY CASCADE;
      DROP INDEX IF EXISTS idx_employees_country;
      DROP INDEX IF EXISTS idx_employees_job_title;
      DROP INDEX IF EXISTS idx_employees_department;
      DROP INDEX IF EXISTS idx_employees_country_job;
      DROP INDEX IF EXISTS idx_employees_salary;
      DROP INDEX IF EXISTS idx_employees_full_name_gin;
    `);
    console.log(`${Date.now() - t}ms`);

    // Phase 2: bulk load via COPY.
    // synchronous_commit=off skips WAL fsync per-transaction — safe for seed
    // data because a crash just means re-running the script, not data loss.
    process.stdout.write(`  Copying ${total.toLocaleString()} rows… `);
    t = Date.now();
    await client.query("SET synchronous_commit = off");

    const names = buildNameGrid(total);
    const copyStream = client.query(
      copyFrom(
        "COPY employees (full_name, job_title, country, salary, department, email, hire_date) FROM STDIN WITH (FORMAT text, DELIMITER E'\\t')",
      ),
    );

    await new Promise<void>((resolve, reject) => {
      copyStream.on("error", reject);
      copyStream.on("finish", resolve);

      // Push one Buffer per BATCH_SIZE rows instead of one tiny write per row.
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const end = Math.min(i + BATCH_SIZE, total);
        copyStream.write(buildBatch(names, i, end));
      }
      copyStream.end();
    });
    console.log(`${Date.now() - t}ms`);

    // Phase 3: rebuild indexes in one pass over the now-complete table.
    // PostgreSQL can sort and build each index from a full table scan, which
    // is O(N log N) once — vastly cheaper than O(N) incremental updates during load.
    process.stdout.write("  Rebuilding indexes… ");
    t = Date.now();
    await client.query(SECONDARY_INDEXES);
    console.log(`${Date.now() - t}ms`);

    console.log(`\n✓ Seeded ${total.toLocaleString()} employees in ${Date.now() - t0}ms total.`);
  } catch (err) {
    console.error("\nSeed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
