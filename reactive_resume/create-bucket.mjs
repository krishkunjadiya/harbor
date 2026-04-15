import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://postgres.clvadccdadymkkvoczsh:krishkunjadiya08$$@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createBucket() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // Create the learning_resources bucket if it doesn't exist
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('learning_resources', 'learning_resources', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    // Allow public access to read files
    await client.query(`
      CREATE POLICY "Public Access" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'learning_resources' );
    `).catch(e => console.log('Policy may already exist:', e.message));

    // Allow authenticated users to upload/delete (for admins/faculty)
    await client.query(`
      CREATE POLICY "Auth Upload" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'learning_resources' AND auth.role() = 'authenticated' );
    `).catch(e => console.log('Policy may already exist:', e.message));

    await client.query(`
      CREATE POLICY "Auth Update" 
      ON storage.objects FOR UPDATE 
      WITH CHECK ( bucket_id = 'learning_resources' AND auth.role() = 'authenticated' );
    `).catch(e => console.log('Policy may already exist:', e.message));

    await client.query(`
      CREATE POLICY "Auth Delete" 
      ON storage.objects FOR DELETE 
      USING ( bucket_id = 'learning_resources' AND auth.role() = 'authenticated' );
    `).catch(e => console.log('Policy may already exist:', e.message));

    console.log("Storage bucket 'learning_resources' configured successfully!");
  } catch (e) {
    console.error("Bucket creation error:", e);
  } finally {
    await client.end();
  }
}

createBucket();
