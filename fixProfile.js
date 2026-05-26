const fs = require('fs');

async function fixDuplicateProfile() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  // Set Limon's user_id to null to prevent the .single() crash for the admin user
  await fetch(`${url}/rest/v1/profiles?id=eq.e5eff228-5393-49a6-b3a8-2fee42cd1510`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: null })
  });
  console.log("Fixed duplicate profile!");
}

fixDuplicateProfile();
