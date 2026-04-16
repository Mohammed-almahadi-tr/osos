import { supabase } from './supabase';

/**
 * Fetch all available courses.
 */
export const getAllCourses = async () => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
    return data;
};

/**
 * Assign a course to a company.
 * @param {string} company_id 
 * @param {string} course_id 
 */
export const assignCourseToCompany = async (company_id, course_id) => {
    const { data, error } = await supabase
        .from('company_courses')
        .insert([{ company_id, course_id }])
        .select()
        .single();

    if (error) {
        console.error('Error assigning course to company:', error);
        throw error;
    }
    return data;
};

/**
 * Get all courses assigned to a specific company.
 * Also fetches course details (name, duration).
 * @param {string} company_id 
 */
export const getCoursesByCompany = async (company_id) => {
    const { data, error } = await supabase
        .from('company_courses')
        .select(`
            id,
            company_id,
            course_id,
            created_at,
            courses (
                name,
                duration
            ),
            companies (
                name
            )
        `)
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses by company:', error);
        throw error;
    }
    
    // Flatten result for easier usage in UI
    return data.map(item => ({
        id: item.id,
        company_id: item.company_id,
        course_id: item.course_id,
        course_name: item.courses?.name,
        course_duration: item.courses?.duration,
        company_name: item.companies?.name,
        assigned_at: item.created_at
    }));
};

/**
 * Get all companies assigned to a specific course.
 * @param {string} course_id 
 */
export const getCompaniesByCourse = async (course_id) => {
    const { data, error } = await supabase
        .from('company_courses')
        .select(`
            id,
            company_id,
            course_id,
            created_at,
            companies (
                name
            ),
            courses (
                name,
                duration
            )
        `)
        .eq('course_id', course_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching companies by course:', error);
        throw error;
    }

    // Flatten result for easier usage in UI
    return data.map(item => ({
        id: item.id,
        company_id: item.company_id,
        course_id: item.course_id,
        company_name: item.companies?.name,
        course_name: item.courses?.name,
        course_duration: item.courses?.duration,
        assigned_at: item.created_at
    }));
};

/**
 * Remove an assignment.
 * @param {string} id - The primary key (id) of the company_courses table
 */
export const removeAssignment = async (id) => {
    const { error } = await supabase
        .from('company_courses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error removing course assignment:', error);
        throw error;
    }
    return true;
};
