import api from '@/lib/api';

export interface Student {
    studentId: string;
    authUserId: string;
    fullName: string;
    email: string;
    phone?: string;
    rollNo?: string;
    classId?: string;
    status: string;
    profileImage?: string;
    class?: {
        classId: string;
        className: string;
        section?: string;
        school?: {
            schoolId: string;
            schoolName: string;
        };
    };
}

export interface StudentQuery {
    classId?: string;
    status?: string; // 'active' | 'inactive' | 'all'
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateStudentDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    classId?: string;
    rollNo?: string;
}

export interface UpdateStudentDto {
    fullName?: string;
    phone?: string;
    classId?: string;
    rollNo?: string;
    status?: string;
}

// Backend returns flat pagination: { data, total, page, limit, totalPages }
interface BackendPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Frontend expects nested pagination
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const studentsService = {
    /**
     * Get all students (paginated)
     * Excludes soft-deleted (status='inactive') by default
     */
    getAll: async (query?: StudentQuery): Promise<PaginatedResponse<Student>> => {
        const params = new URLSearchParams();
        if (query?.classId) params.append('classId', query.classId);
        if (query?.status) params.append('status', query.status);
        if (query?.search) params.append('search', query.search);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());

        const response = await api.get<BackendPaginatedResponse<Student>>(`/students?${params.toString()}`);

        // Map backend flat format to frontend nested format
        return {
            data: response.data.data,
            pagination: {
                total: response.data.total,
                page: response.data.page,
                limit: response.data.limit,
                pages: response.data.totalPages,
            },
        };
    },

    /**
     * Get current student's own profile (for logged-in students)
     */
    getMe: async (): Promise<Student> => {
        const response = await api.get<Student>('/students/me');
        return response.data;
    },

    /**
     * Get student by ID
     */
    getById: async (id: string): Promise<Student> => {
        const response = await api.get<Student>(`/students/${id}`);
        return response.data;
    },

    /**
     * Create a new student
     */
    create: async (data: CreateStudentDto): Promise<Student> => {
        const response = await api.post<Student>('/students', data);
        return response.data;
    },

    /**
     * Update student (uses PUT, not PATCH)
     */
    update: async (id: string, data: UpdateStudentDto): Promise<Student> => {
        const response = await api.put<Student>(`/students/${id}`, data);
        return response.data;
    },

    /**
     * Soft-delete student (sets status to 'inactive')
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/students/${id}`);
        return response.data;
    },

    /**
     * Link student to parent
     */
    linkToParent: async (studentId: string, parentId: string): Promise<Student> => {
        const response = await api.post<Student>(`/students/${studentId}/link-parent`, { parentId });
        return response.data;
    },

    /**
     * Helper: Check if student is active (not soft-deleted)
     */
    isActive: (student: Student): boolean => {
        return student.status !== 'inactive';
    },
};
