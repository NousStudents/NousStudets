import api from '@/lib/api';

export interface Teacher {
    teacherId: string;
    authUserId: string;
    schoolId: string;
    fullName: string;
    email: string;
    phone?: string;
    subjectSpecialization?: string;
    status: string;
    profileImage?: string;
    school?: {
        schoolId: string;
        schoolName: string;
    };
    classTeacherOf?: {
        classId: string;
        className: string;
        section?: string;
    }[];
}

export interface TeacherQuery {
    subject?: string;
    status?: string; // 'active' | 'inactive' | 'all'
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateTeacherDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    subjectSpecialization?: string;
}

export interface UpdateTeacherDto {
    fullName?: string;
    phone?: string;
    subjectSpecialization?: string;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const teachersService = {
    /**
     * Get all teachers (paginated)
     * Excludes soft-deleted (status='inactive') by default
     */
    getAll: async (query?: TeacherQuery): Promise<PaginatedResponse<Teacher>> => {
        const params = new URLSearchParams();
        if (query?.subject) params.append('subject', query.subject);
        if (query?.status) params.append('status', query.status);
        if (query?.search) params.append('search', query.search);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());

        const response = await api.get<PaginatedResponse<Teacher>>(`/teachers?${params.toString()}`);
        return response.data;
    },

    /**
     * Get current teacher's own profile (for logged-in teachers)
     */
    getMe: async (): Promise<Teacher> => {
        const response = await api.get<Teacher>('/teachers/me');
        return response.data;
    },

    /**
     * Get teacher by ID
     */
    getById: async (id: string): Promise<Teacher> => {
        const response = await api.get<Teacher>(`/teachers/${id}`);
        return response.data;
    },

    /**
     * Create a new teacher
     */
    create: async (data: CreateTeacherDto): Promise<Teacher> => {
        const response = await api.post<Teacher>('/teachers', data);
        return response.data;
    },

    /**
     * Update teacher (uses PUT, not PATCH)
     */
    update: async (id: string, data: UpdateTeacherDto): Promise<Teacher> => {
        const response = await api.put<Teacher>(`/teachers/${id}`, data);
        return response.data;
    },

    /**
     * Soft-delete teacher (sets status to 'inactive')
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/teachers/${id}`);
        return response.data;
    },

    /**
     * Assign teacher to classes
     * Backend expects: POST /teachers/:id/assign-classes with { classIds: string[] }
     */
    assignToClasses: async (teacherId: string, classIds: string[]): Promise<Teacher> => {
        const response = await api.post<Teacher>(`/teachers/${teacherId}/assign-classes`, { classIds });
        return response.data;
    },

    /**
     * Assign teacher to a single class (convenience wrapper)
     */
    assignToClass: async (teacherId: string, classId: string): Promise<Teacher> => {
        return teachersService.assignToClasses(teacherId, [classId]);
    },

    /**
     * Helper: Check if teacher is active (not soft-deleted)
     */
    isActive: (teacher: Teacher): boolean => {
        return teacher.status !== 'inactive';
    },
};
