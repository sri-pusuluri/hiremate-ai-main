import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const mockJobs = [
  {
    id: '11111111-1111-1111-1111-111111111111', // valid UUID format
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'full-time',
    salary: '₹35-50 LPA',
    description: 'We are looking for a Senior Frontend Engineer...',
    responsibilities: ['Lead React dev'],
    requirements: ['5+ years'],
    niceToHave: ['Next.js'],
    hireSortEnabled: false
  }
];

async function testSeed() {
  console.log("Seeding test job with UUID...");
  const insertJobs = mockJobs.map(j => ({
    id: j.id,
    title: j.title,
    department: j.department,
    location: j.location,
    type: j.type,
    salary: j.salary,
    description: j.description,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    nice_to_have: j.niceToHave,
    hire_sort_enabled: j.hireSortEnabled,
    ai_processing_status: 'pending'
  }));

  const { data, error } = await supabase.from('jobs').insert(insertJobs).select();
  if (error) {
    console.error("Insert error details:", error);
  } else {
    console.log("Insert success! Created jobs:", data);
  }
}

testSeed();
