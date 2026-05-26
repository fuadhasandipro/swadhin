const fs = require('fs');

async function checkAndFixProfile() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.error("Missing credentials");
    return;
  }

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  // 1. Get all auth.users
  const authRes = await fetch(`${url}/auth/v1/admin/users`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const usersData = await authRes.json();
  console.log(`Found ${usersData.users?.length || 0} auth users`);

  // 2. Get all public.profiles
  const profRes = await fetch(`${url}/rest/v1/profiles?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  const profiles = await profRes.json();
  console.log(`Found ${profiles.length} profiles`);
  console.log("Profiles:", profiles);

  // 3. Find if any user has no profile
  const adminUser = usersData.users?.find(u => u.email === '01712345678@swadhin.local' || u.email.includes('admin'));
  
  if (adminUser) {
    console.log(`Admin user found in auth: ${adminUser.id} (${adminUser.email})`);
    
    const profile = profiles.find(p => p.user_id === adminUser.id);
    if (!profile) {
      console.log("Admin user HAS NO profile! Attempting to fix...");
      
      const orphanedAdminProfile = profiles.find(p => p.role === 'admin' && p.user_id !== adminUser.id);
      
      if (orphanedAdminProfile) {
        console.log(`Found orphaned admin profile (${orphanedAdminProfile.id}), updating its user_id to ${adminUser.id}`);
        await fetch(`${url}/rest/v1/profiles?id=eq.${orphanedAdminProfile.id}`, {
          method: 'PATCH',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: adminUser.id })
        });
        console.log("Successfully fixed admin profile link!");
      } else {
        console.log("No orphaned admin profile found. Creating a new one...");
        await fetch(`${url}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: adminUser.id,
            full_name: 'System Admin',
            phone: adminUser.email.replace('@swadhin.local', ''),
            role: 'admin',
            salary_amount: 0
          })
        });
        console.log("Successfully created new admin profile!");
      }
    } else {
      console.log("Admin user already has a valid profile.");
    }
  } else {
    console.log("No admin user found in auth.users!");
    console.log("Auth users:", usersData.users?.map(u => ({ id: u.id, email: u.email })));
  }
}

checkAndFixProfile();
