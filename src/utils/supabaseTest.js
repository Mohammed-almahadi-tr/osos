import { supabase } from '../services/supabase';

/**
 * Test Supabase connection and configuration
 * Run this in browser console: import('/src/utils/supabaseTest.js').then(m => m.testSupabaseConnection())
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('Expected variables:');
    console.log('  - VITE_SUPABASE_URL');
    console.log('  - VITE_SUPABASE_ANON_KEY');
    return false;
  }
  
  console.log('✅ URL:', url);
  console.log('✅ Key:', key.substring(0, 20) + '...');
  
  // 2. Test database connection
  console.log('\n2️⃣ Testing Database Connection:');
  try {
    const { data, error } = await supabase.from('companies').select('count');
    if (error) {
      console.error('❌ Database query failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    return false;
  }
  
  // 3. Check auth status
  console.log('\n3️⃣ Checking Auth Status:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth check failed:', error.message);
    } else if (session) {
      console.log('✅ User is logged in:', session.user.email);
    } else {
      console.log('ℹ️ No active session (user not logged in)');
    }
  } catch (err) {
    console.error('❌ Auth check error:', err);
  }
  
  // 4. Test profiles table
  console.log('\n4️⃣ Testing Profiles Table:');
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('❌ Profiles query failed:', error.message);
      console.log('💡 Make sure you ran the supabase_schema.sql script');
      return false;
    }
    console.log('✅ Profiles table accessible');
    if (data && data.length > 0) {
      console.log('✅ Sample profile:', data[0]);
    }
  } catch (err) {
    console.error('❌ Profiles table error:', err);
    return false;
  }
  
  console.log('\n✅ All tests passed!');
  return true;
}

/**
 * Create a test user (admin)
 */
export async function createTestAdmin(email, password) {
  console.log('👤 Creating test admin user...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: email.split('@')[0],
          role: 'admin'
        }
      }
    });
    
    if (error) {
      console.error('❌ Failed to create user:', error.message);
      return false;
    }
    
    console.log('✅ User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('\n⚠️ Check your email for confirmation link (if email confirmation is enabled)');
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

/**
 * Manually fix a user's profile role
 */
export async function fixUserRole(userId, role = 'admin') {
  console.log(`🔧 Attempting to update role for user ${userId} to ${role}...`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: role })
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('❌ Failed to update role:', error.message);
      console.log('💡 You may need to do this directly in Supabase Dashboard');
      return false;
    }
    
    console.log('✅ Role updated successfully!');
    console.log('Updated profile:', data[0]);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Export for console usage
window.testSupabase = testSupabaseConnection;
window.createTestAdmin = createTestAdmin;
window.fixUserRole = fixUserRole;
