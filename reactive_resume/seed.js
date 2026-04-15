const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.clvadccdadymkkvoczsh:krishkunjadiya08$$@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const resources = [
  { title: 'Fullstack Next.js Guide', description: 'Comprehensive guide to building apps with Next.js App Router.', type: 'video', category: 'Frontend', duration: '2h 15m', file_size: null, author: 'Vercel', url: 'https://nextjs.org/learn' },
  { title: 'React Performance Optimization', description: 'Learn how to avoid re-renders and use React Compiler.', type: 'document', category: 'Frontend', duration: null, file_size: '2.5 MB', author: 'React Team', url: 'https://react.dev' },
  { title: 'Supabase Row Level Security', description: 'Deep dive into securing your Postgres database.', type: 'video', category: 'Backend', duration: '45m', file_size: null, author: 'Supabase', url: 'https://supabase.com/docs' },
  { title: 'System Design Interview Prep', description: 'Top 50 system design questions for senior roles.', type: 'book', category: 'Interview Prep', duration: null, file_size: '15 MB', author: 'Tech Blueprint', url: 'https://example.com' },
  { title: 'Mastering Tailwind CSS', description: 'Advanced techniques for utility-first styling.', type: 'video', category: 'Design', duration: '1h 30m', file_size: null, author: 'Tailwind Labs', url: 'https://tailwindcss.com' },
  { title: 'PostgreSQL for Beginners', description: 'Start your journey into relational databases.', type: 'document', category: 'Backend', duration: null, file_size: '1.2 MB', author: 'Postgres', url: 'https://postgresql.org' },
  { title: 'Dockerizing Next.js Apps', description: 'Step-by-step guide to production Docker deployments.', type: 'link', category: 'DevOps', duration: null, file_size: null, author: 'Vercel', url: 'https://vercel.com' },
  { title: 'TypeScript Advanced Patterns', description: 'Generics, conditional types, and utility types.', type: 'video', category: 'Frontend', duration: '1h 10m', file_size: null, author: 'Matt Pocock', url: 'https://typescriptlang.org' },
  { title: 'Behavioral Interview Handbook', description: 'A complete guide to the STAR method.', type: 'book', category: 'Interview Prep', duration: null, file_size: '5.5 MB', author: 'Career Prep', url: 'https://example.com' },
  { title: 'Understanding CI/CD Pipelines', description: 'GitHub Actions and deployment strategies.', type: 'link', category: 'DevOps', duration: null, file_size: null, author: 'GitHub', url: 'https://github.com' }
];

async function seed() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_resources (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        title text NOT NULL,
        description text NOT NULL,
        type text NOT NULL,
        category text NOT NULL,
        duration text,
        file_size text,
        author text,
        url text NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );
    `);
    console.log("Created learning_resources table.");

    // Clear existing (optional, but good for idempotency if we run this multiple times)
    await client.query('TRUNCATE TABLE learning_resources;');

    // Insert mock data
    for (const r of resources) {
      await client.query(`
        INSERT INTO learning_resources (title, description, type, category, duration, file_size, author, url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [r.title, r.description, r.type, r.category, r.duration, r.file_size, r.author, r.url]);
    }

    console.log("Inserted 10 mock resources successfully!");
  } catch (e) {
    console.error("Database seed error:", e);
  } finally {
    await client.end();
  }
}

seed();
