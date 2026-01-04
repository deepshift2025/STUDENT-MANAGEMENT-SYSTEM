import { User, CourseUnit, Enrollment, Mark, GroupProfile, Notification, SystemSettings, Intake } from '../types';
import { supabase } from './supabase';

const toCamelCase = (obj: any): any => {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => toCamelCase(v));
    return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
        result[camelKey] = toCamelCase(obj[key]);
        return result;
    }, {} as any);
};

const toSnakeCase = (obj: any): any => {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => toSnakeCase(v));
    return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = toSnakeCase(obj[key]);
        return result;
    }, {} as any);
};

export const api = {
    fetchAllData: async () => {
        const safeFetch = async (promise: Promise<any>, tableName: string, defaultValue: any = []) => {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${tableName}`)), 10000));
                const { data, error } = await (Promise.race([promise, timeoutPromise]) as Promise<any>);
                if (error) { console.warn(`Supabase error [${tableName}]:`, error.message); return defaultValue; }
                return data || defaultValue;
            } catch (err) { console.warn(`Exception [${tableName}]:`, err); return defaultValue; }
        };

        const [
            users,
            courses,
            intakes,
            enrollments,
            marks,
            mcqTests,
            testSubmissions,
            groupProfiles,
            notifications,
            systemSettingsRaw
        ] = await Promise.all([
            safeFetch(supabase.from('users').select('*'), 'users'),
            safeFetch(supabase.from('courses').select('*'), 'courses'),
            safeFetch(supabase.from('intakes').select('*'), 'intakes'),
            safeFetch(supabase.from('enrollments').select('*'), 'enrollments'),
            safeFetch(supabase.from('marks').select('*'), 'marks'),
            safeFetch(supabase.from('mcq_tests').select('*'), 'mcq_tests'),
            safeFetch(supabase.from('mcq_submissions').select('*'), 'mcq_submissions'),
            // Exclude 'assignment' blob to prevent bulk fetch timeouts
            safeFetch(supabase.from('group_profiles').select('leader_id, group_name, project_brief, members'), 'group_profiles'),
            safeFetch(supabase.from('notifications').select('*'), 'notifications'),
            safeFetch(supabase.from('system_settings').select('*').limit(1).maybeSingle(), 'system_settings', null)
        ]);

        return {
            users: toCamelCase(users),
            courses: toCamelCase(courses),
            intakes: toCamelCase(intakes),
            enrollments: toCamelCase(enrollments),
            marks: toCamelCase(marks),
            mcqTests: toCamelCase(mcqTests),
            testSubmissions: toCamelCase(testSubmissions),
            groupProfiles: toCamelCase(groupProfiles),
            notifications: toCamelCase(notifications),
            systemSettings: systemSettingsRaw ? toCamelCase(systemSettingsRaw) : null,
        };
    },

    fetchAssignments: async (): Promise<GroupProfile[]> => {
        // Only fetch metadata. The 'assignment' field is filtered but NOT selected to save bandwidth and prevent timeouts.
        const { data, error } = await supabase
            .from('group_profiles')
            .select('leader_id, group_name, project_brief')
            .not('assignment', 'is', null);
            
        if (error) throw new Error(`Failed to fetch assignments: ${error.message}`);
        return toCamelCase(data || []);
    },

    fetchAssignmentData: async (leaderId: string): Promise<{ name: string; type: string; data: string } | null> => {
        const { data, error } = await supabase
            .from('group_profiles')
            .select('assignment')
            .eq('leader_id', leaderId)
            .single();
            
        if (error || !data?.assignment) return null;
        return toCamelCase(data.assignment);
    },

    fetchGroupProfile: async (leaderId: string): Promise<GroupProfile | null> => {
        try {
            const { data, error } = await supabase.from('group_profiles').select('*').eq('leader_id', leaderId).maybeSingle();
            if (error) return null;
            return data ? toCamelCase(data) : null;
        } catch (e) { return null; }
    },

    saveMultiple: async <T>(tableName: string, data: T[]): Promise<void> => {
        const { error } = await supabase.from(tableName).upsert(toSnakeCase(data));
        if (error) throw new Error(`Failed to save to ${tableName}: ${error.message}`);
    },

    deleteMultiple: async (tableName: string, column: string, values: any[]): Promise<void> => {
        const { error } = await supabase.from(tableName).delete().in(column, values);
        if (error) throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
    },
    
    saveUsers: async (users: User[]): Promise<void> => { await api.saveMultiple('users', users); },
    saveCourses: async (courses: CourseUnit[]): Promise<void> => { await api.saveMultiple('courses', courses); },
    saveIntakes: async (intakes: Intake[]): Promise<void> => { await api.saveMultiple('intakes', intakes); },
    saveEnrollments: async (enrollments: Enrollment[]): Promise<void> => { await api.saveMultiple('enrollments', enrollments); },
    saveMarks: async (marks: Mark[]): Promise<void> => { await api.saveMultiple('marks', marks); },
    saveGroupProfiles: async (profiles: GroupProfile[]): Promise<void> => { await api.saveMultiple('group_profiles', profiles); },
    saveNotifications: async (notifications: Notification[]): Promise<void> => { await api.saveMultiple('notifications', notifications); },
    
    saveSystemSettings: async (settings: SystemSettings): Promise<void> => {
        const { error } = await supabase.from('system_settings').upsert(toSnakeCase({ ...settings, id: 1 }));
        if (error) throw new Error(`Failed to save system settings: ${error.message}`);
    },

    deleteCourseWithRelations: async (courseId: string): Promise<void> => {
        const { data: enrolls, error: enrollError } = await supabase.from('enrollments').select('id').eq('course_id', courseId);
        if (enrollError) throw new Error('Could not fetch enrollments for deletion.');
        const enrollmentIds = enrolls.map(e => e.id);
        if (enrollmentIds.length > 0) {
            await supabase.from('marks').delete().in('enrollment_id', enrollmentIds);
            await supabase.from('enrollments').delete().in('id', enrollmentIds);
        }
        const { error: courseError } = await supabase.from('courses').delete().eq('id', courseId);
        if (courseError) throw new Error('Could not delete the course.');
    },

    deleteStudentWithRelations: async (studentId: string): Promise<void> => {
         const { error } = await supabase.from('users').delete().eq('id', studentId);
         if (error) throw new Error(`Failed to delete student: ${error.message}`);
    },

    deleteIntakeWithRelations: async (intakeId: string): Promise<void> => {
        // Just delete the intake. Users will have their intake_id nullified if foreign key is set correctly, 
        // or we can nullify it here if we want to be safe.
        await supabase.from('users').update({ intake_id: null }).eq('intake_id', intakeId);
        const { error } = await supabase.from('intakes').delete().eq('id', intakeId);
        if (error) throw new Error(`Failed to delete intake: ${error.message}`);
    }
};