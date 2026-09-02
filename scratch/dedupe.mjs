import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function dedupe() {
  console.log("Fetching all candidates...");
  const { data, error } = await supabase.from('candidates').select('id, email, job_id, created_at').order('created_at', { ascending: true });
  
  if (error) {
    console.error("Error fetching candidates:", error);
    return;
  }
  
  console.log(`Found ${data.length} total candidates.`);
  
  const seen = new Set();
  const toDelete = [];
  
  for (const cand of data) {
    const key = `${cand.email}-${cand.job_id}`;
    if (seen.has(key)) {
      toDelete.push(cand.id);
    } else {
      seen.add(key);
    }
  }
  
  console.log(`Found ${toDelete.length} duplicates to delete.`);
  
  if (toDelete.length > 0) {
    // Delete in batches of 100
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error: delError } = await supabase.from('candidates').delete().in('id', batch);
      if (delError) {
        console.error("Error deleting batch:", delError);
      } else {
        console.log(`Deleted batch of ${batch.length} duplicates.`);
      }
    }
  }
  console.log("Deduplication complete!");
}

dedupe();
