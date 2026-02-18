import api from '@/lib/api';

export interface LoginCredentials {
    email: string;
    password: string;
    role: string; // Used for UI verification, backend validates matches
    schoolId: string; // Required for strict tenant scoping
}

export interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'teacher' | 'parent';
    schoolId: string;
    // Specific fields based on role
    studentId?: string; // For linking parent to student during parent registration
}

export interface StudentProfile {
    student_id: string;
    first_name: string;
    last_name: string;
    class_id?: string;
}

export interface TeacherProfile {
    teacher_id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
}

export interface ParentProfile {
    parent_id: string;
    first_name: string;
    last_name: string;
}

export interface AdminProfile {
    admin_id: string;
    full_name: string;
}

export interface UserProfile {
    userId: string;
    email: string;
    fullName: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    schoolId: string;
    phone?: string;
    avatar?: string;
    mustChangePassword: boolean;
    status: string;
    school: {
        schoolId: string;
        name: string;
        domain: string;
    };
    profile: StudentProfile | TeacherProfile | ParentProfile | AdminProfile | null;
}

export const authService = {
    /**
     * Login with email, password, role, and schoolId.
     * Returns: { accessToken, refreshToken, user }
     */
    login: async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    /**
     * Register a new user using role-specific endpoints.
     */
    register: async (data: RegisterData) => {
        // Map role to specific endpoint for strict validation
        const endpoint = `/auth/register/${data.role}`;
        const response = await api.post(endpoint, data);
        return response.data;
    },

    /**
     * Get current user profile using the access token.
     * Token is automatically injected by api interceptor.
     */
    getProfile: async () => {
        const response = await api.get<UserProfile>('/auth/me');
        return response.data;
    },

    /**
     * Logout the user.
     */
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    /**
     * Refresh access token.
     */
    refreshToken: async (token: string) => {
        // Backend expects 'refreshToken' in camelCase
        const response = await api.post('/auth/refresh', { refreshToken: token });
        return response.data;
    },
};
