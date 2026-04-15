const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function readEnvFile(envPath) {
  const env = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function parseCsv(csvText) {
  const text = csvText.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field);
      field = '';

      const isEmptyRow = row.every((cell) => String(cell).trim() === '');
      if (!isEmptyRow) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    const isEmptyRow = row.every((cell) => String(cell).trim() === '');
    if (!isEmptyRow) rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => String(h).trim());
  const dataRows = rows.slice(1);

  return dataRows.map((cells) => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = (cells[i] ?? '').trim();
    }
    return obj;
  });
}

function normalizeSkillName(value) {
  if (!value) return '';
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^[-,;:]+|[-,;:]+$/g, '')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 120) return '';
  return cleaned;
}

function skillCodeFromName(name) {
  const slug = name
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'skill';

  const hash = crypto.createHash('sha1').update(name.toLowerCase()).digest('hex').slice(0, 10);
  return `SKILL-${slug}-${hash}`;
}

async function main() {
  const root = process.cwd();
  const env = readEnvFile(path.join(root, '.env.local'));

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials in .env.local');
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const csvPath = path.join(root, 'seed-csv', 'Technology_Skills_Fixed.csv');
  const csvData = parseCsv(fs.readFileSync(csvPath, 'utf8'));

  const curatedSoftSkills = [
    'Leadership',
    'Communication',
    'Teamwork',
    'Problem Solving',
    'Critical Thinking',
    'Time Management',
    'Adaptability',
    'Collaboration',
    'Decision Making',
    'Conflict Resolution',
    'Public Speaking',
    'Negotiation',
    'Creativity',
    'Mentoring',
    'Emotional Intelligence',
  ];

  const candidateSkills = new Map();

  for (const row of csvData) {
    const skill = normalizeSkillName(row.example);
    if (!skill) continue;

    candidateSkills.set(skill.toLowerCase(), {
      title: skill,
      commodity_title: normalizeSkillName(row.commodity_title) || 'Technology Skill',
      source_soc: row.onet_soc_code || '',
      hot_technology: row.hot_technology || 'Y',
      in_demand: row.in_demand || 'Y',
    });
  }

  for (const softSkill of curatedSoftSkills) {
    candidateSkills.set(softSkill.toLowerCase(), {
      title: softSkill,
      commodity_title: 'Soft Skill',
      source_soc: 'SOFT-SKILL',
      hot_technology: 'N',
      in_demand: 'Y',
    });
  }

  const existing = await supabase.from('skills_taxonomy').select('title');
  if (existing.error) {
    throw new Error(`Unable to read existing skills_taxonomy titles: ${existing.error.message}`);
  }

  const existingTitles = new Set((existing.data || []).map((r) => String(r.title || '').toLowerCase()));

  const rowsToInsert = [];
  for (const [key, meta] of candidateSkills.entries()) {
    if (existingTitles.has(key)) continue;

    const code = skillCodeFromName(meta.title);
    rowsToInsert.push({
      onet_soc_code: code,
      title: meta.title,
      example: meta.title,
      commodity_code: 'SKILL',
      commodity_title: meta.commodity_title,
      hot_technology: meta.hot_technology,
      in_demand: meta.in_demand,
    });
  }

  if (rowsToInsert.length === 0) {
    console.log('No new individual skills needed; table already contains all derived titles.');
    return;
  }

  const batchSize = 200;
  let inserted = 0;

  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize);
    const res = await supabase.from('skills_taxonomy').insert(batch);
    if (res.error) {
      throw new Error(`Insert failed at batch ${i / batchSize + 1}: ${res.error.message}`);
    }
    inserted += batch.length;
  }

  console.log(`Inserted ${inserted} individual skills into skills_taxonomy.`);

  const checks = ['python', 'c++', 'leadership', 'communication', 'sql'];
  for (const term of checks) {
    const q = await supabase
      .from('skills_taxonomy')
      .select('*', { count: 'exact', head: true })
      .ilike('title', `%${term}%`);

    if (q.error) {
      throw new Error(`Verification query failed for ${term}: ${q.error.message}`);
    }

    console.log(`title ILIKE '%${term}%': ${q.count}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
