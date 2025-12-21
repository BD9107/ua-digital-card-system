const { createClient } = require('@supabase/supabase-js');

// Load env vars
const SUPABASE_URL = 'https://urntwznaqnaxofylqnfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybnR3em5hcW5heG9meWxxbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjI0MTYsImV4cCI6MjA3OTM5ODQxNn0.Vac4_xiOTa6dTdEv_MoRp1nE_LpvuDdw072Isdnzfz8';

//console.log('✓ Environment Variables:');
//console.log('  SUPABASE_URL:', SUPABASE_URL);
//console.log('  SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 30) + '...');
//console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    //console.log('→ Testing Supabase connection...');
    
    // Fetch all employees
    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' });
    
    if (error) {
      //console.error('✗ Error fetching employees:', error.message);
      //console.error('  Details:', error);
      process.exit(1);
    }
    
    //console.log('✓ Successfully connected to Supabase!');
    //console.log('  Total employees:', count || data?.length || 0);
    //console.log('');
    
    if (data && data.length > 0) {
     //console.log('✓ Employee data found:');
      data.forEach((emp, index) => {
        //console.log(`  ${index + 1}. ${emp.first_name} ${emp.last_name}`);
        //console.log(`     Email: ${emp.email}`);
        //console.log(`     Department: ${emp.department || 'N/A'}`);
        //console.log(`     Status: ${emp.is_active ? 'Active' : 'Inactive'}`);
        //console.log('');
      });
    } else {
      //console.log('⚠ No employees found in the database.');
    }
    
  } catch (err) {
    //'✗ Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
