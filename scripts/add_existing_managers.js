import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load env variables manually since this is a standalone script
const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('Could not find .env.local file. Make sure you run this from the project root.');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error('Could not find VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const SUPABASE_URL = urlMatch[1].trim();
const SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Fetching companies...');
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true }); // "based on the newest" - actually ascending means oldest first. Let's do descending if they want newest first, but "manager1, manager2 based on the newest" usually means chronological. Let's stick to ascending so the oldest gets manager1.

  if (error) {
    console.error('Error fetching companies:', error);
    process.exit(1);
  }

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const num = i + 1;
    const username = `manager${num}`;
    const password = `pass${num}`;

    console.log(`\nProcessing company: ${company.name}`);
    console.log(`Creating manager: username=${username}, password=${password}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${username}@example.com`,
      password: password,
      email_confirm: true,
      user_metadata: { username, role: 'company_manager' }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`User ${username} already exists. Skipping auth creation.`);
        // We could fetch the user ID here to continue, but for simplicity we'll skip
        continue;
      } else {
        console.error('Error creating user', username, authError);
        continue;
      }
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert([
      { id: userId, username, role: 'company_manager' }
    ]);

    if (profileError) {
      console.error('Error creating profile for', username, profileError);
      continue;
    }

    // Link manager to company
    const { error: cmError } = await supabase.from('company_managers').insert([
      { user_id: userId, company_id: company.id }
    ]);

    if (cmError) {
      console.error('Error linking manager to company for', username, cmError);
    } else {
      console.log(`Successfully created manager for ${company.name}`);
    }
  }

  console.log('\nFinished creating existing managers.');
}

main().catch(console.error);
