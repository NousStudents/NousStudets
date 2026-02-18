import api from '@/lib/api';

export interface Class {
    classId: string;
    className: string;
    section?: string;
    grade?: string;
    academicYear?: string;
    roomNumber?: string;
    schoolId: string;
    classTeacherId?: string;
    school?: {
        schoolId: string;
        schoolName: string;
    };
    classTeacher?: {
        teacherId: string;
        fullName: string;
    };
    _count?: {
        students: number;
    };
}

export interface ClassQuery {
    grade?: string;
    academicYear?: string;
    teacherId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateClassDto {
    className: string;
    section?: string;
    grade?: string;
    academicYear?: string;
    roomNumber?: string;
    classTeacherId?: string;
}

export interface UpdateClassDto {
    className?: string;
    section?: string;
    grade?: string;
    academicYear?: string;
    roomNumber?: string;
    classTeacherId?: string;
}

export interface ClassStats {
    totalStudents: number;
    maleCount: number;
    femaleCount: number;
    avgAttendance?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const classesService = {
    /**
     * Get all classes (paginated)
     */
    getAll: async (query?: ClassQuery): Promise<PaginatedResponse<Class>> => {
        const params = new URLSearchParams();
        if (query?.grade) params.append('grade', query.grade);
        if (query?.academicYear) params.append('academicYear', query.academicYear);
        if (query?.teacherId) params.append('teacherId', query.teacherId);
        if (query?.search) params.append('search', query.search);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());

        const response = await api.get<PaginatedResponse<Class>>(`/classes?${params.toString()}`);
        return response.data;
    },

    /**
     * Get classes assigned to the logged-in teacher
     * NOTE: This is /classes/my-classes, NOT /teachers/my-classes
     */
    getMyClasses: async (): Promise<Class[]> => {
        const response = await api.get<Class[]>('/classes/my-classes');
        return response.data;
    },

    /**
     * Get class by ID
     */
    getById: async (id: string): Promise<Class> => {
        const response = await api.get<Class>(`/classes/${id}`);
        return response.data;
    },

    /**
     * Get class statistics
     */
    getStats: async (id: string): Promise<ClassStats> => {
        const response = await api.get<ClassStats>(`/classes/${id}/stats`);
        return response.data;
    },

    /**
     * Create a new class
     */
    create: async (data: CreateClassDto): Promise<Class> => {
        const response = await api.post<Class>('/classes', data);
        return response.data;
    },

    /**
     * Update class (uses PUT, not PATCH)
     */
    update: async (id: string, data: UpdateClassDto): Promise<Class> => {
        const response = await api.put<Class>(`/classes/${id}`, data);
        return response.data;
    },

    /**
     * Delete class (will fail if students are enrolled)
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/classes/${id}`);
        return response.data;
    },
};
