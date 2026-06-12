import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Supabase URL:", process.env.SUPABASE_URL);
  
  // 1. Get employees/users
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, role, email')
    .eq('role', 'Employee');
    
  if (userError) {
    console.error("Error fetching users:", userError);
    return;
  }
  
  console.log("Employees found:", users);
  
  if (users.length > 0) {
    const empId = users[0].id;
    console.log(`\nFetching progress for employee ${users[0].name} (${empId}):`);
    
    const { data: progress, error: progError } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', empId);
      
    if (progError) {
      console.error("Error fetching progress:", progError);
    } else {
      console.log("Progress rows:", progress);
    }
  }
}

run();
