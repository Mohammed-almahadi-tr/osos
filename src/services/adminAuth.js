import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { createClient } from '@supabase/supabase-js';

// Create a secondary Supabase client that doesn't persist sessions
// This ensures that when the admin creates a new employee user,
// the admin's own session is not overwritten or logged out.
const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Admin service for creating employee user accounts
 * This handles the creation of auth users and their profiles
 */

/**
 * Create a new employee user account
 * @param {Object} userData - User data
 * @param {string} userData.username - Username for login
 * @param {string} userData.password - Password for the user
 * @param {string} userData.email - Email (optional, will generate if not provided)
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export async function createEmployeeUser({ username, password, email }) {
  try {
    // Generate email if not provided
    const userEmail = email || `${username}@system.local`;
    
    console.log('🔐 Creating employee user account:', { username, email: userEmail });

    // Create the user account using the admin client so it doesn't log out the current admin
    const { data: authData, error: authError } = await adminSupabase.auth.signUp({
      email: userEmail,
      password: password,
      options: {
        data: {
          username: username,
          role: 'employee'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      
      // Provide user-friendly error messages
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل' };
      }
      
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'فشل إنشاء حساب المستخدم' };
    }

    const userId = authData.user.id;
    console.log('✅ User account created:', userId);

    // Ensure profile exists with correct role
    // The trigger should create it, but we'll upsert to be safe
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: username,
        role: 'employee'
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.warn('⚠️ Profile upsert warning:', profileError);
      // Don't fail here - the trigger might have already created it
    } else {
      console.log('✅ Profile created/updated successfully');
    }

    return { success: true, userId };
    
  } catch (error) {
    console.error('❌ Unexpected error creating user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new company manager account
 * @param {Object} userData - User data
 * @param {string} userData.username - Username for login
 * @param {string} userData.password - Password for the user
 * @param {string} userData.company_id - Company ID this manager belongs to
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export async function createManagerUser({ username, password, company_id }) {
  try {
    const userEmail = `${username}@system.local`;
    console.log('🔐 Creating manager user account:', { username });

    const { data: authData, error: authError } = await adminSupabase.auth.signUp({
      email: userEmail,
      password: password,
      options: {
        data: {
          username: username,
          role: 'company_manager'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'اسم المستخدم مستخدم بالفعل' };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'فشل إنشاء حساب المستخدم' };
    }

    const userId = authData.user.id;
    console.log('✅ Manager account created:', userId);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: username,
        role: 'company_manager'
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('⚠️ Profile upsert error:', profileError);
    }

    const { error: cmError } = await supabase
      .from('company_managers')
      .insert({
        user_id: userId,
        company_id: company_id
      });

    if (cmError) {
      console.warn('⚠️ Company manager link error:', cmError);
    }

    return { success: true, userId };
  } catch (error) {
    console.error('❌ Unexpected error creating manager:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a username is already taken
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} - True if available, false if taken
 */
export async function isUsernameAvailable(username) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return !data; // Available if no data found
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Check if an email is already registered
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if available, false if taken
 */
export async function isEmailAvailable(email) {
  try {
    // We can't directly query auth.users, so we check employees table
    const { data, error } = await supabase
      .from('employees')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking email:', error);
      return false;
    }

    return !data; // Available if no data found
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}
