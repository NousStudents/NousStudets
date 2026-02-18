import api from '@/lib/api';

export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
    id: string;
    authUserId: string;
    email: string;
    fullName: string;
    phone?: string;
    role: Role;
    status: string;
    schoolId: string;
    school?: {
        schoolId: string;
        schoolName: string;
    };
    profile?: Record<string, any>;
}

export interface UserQuery {
    role: Role; // REQUIRED for pagination accuracy
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface ResolvedId {
    authUserId: string;
    role: Role;
}

export const usersService = {
    /**
     * Get all users by role (paginated)
     * NOTE: role filter is REQUIRED for accurate pagination
     */
    getAll: async (query: UserQuery): Promise<PaginatedResponse<User>> => {
        const params = new URLSearchParams();
        params.append('role', query.role); // Required
        if (query?.status) params.append('status', query.status);
        if (query?.search) params.append('search', query.search);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());

        const response = await api.get<PaginatedResponse<User>>(`/users?${params.toString()}`);
        return response.data;
    },

    /**
     * Get users by specific role
     */
    getByRole: async (role: Role): Promise<User[]> => {
        const response = await api.get<User[]>(`/users/role/${role}`);
        return response.data;
    },

    /**
     * Get user by authUserId
     * NOTE: This expects authUserId, NOT roleId (studentId/teacherId)
     * Use resolveRoleId() first if you only have a role-specific ID
     */
    getById: async (authUserId: string): Promise<User> => {
        const response = await api.get<User>(`/users/${authUserId}`);
        return response.data;
    },

    /**
     * Resolve role-specific ID (studentId, teacherId, etc.) to authUserId
     * Use this when you have a roleId but need authUserId for /users/:id
     */
    resolveRoleId: async (role: Role, roleId: string): Promise<ResolvedId> => {
        const response = await api.get<ResolvedId>(`/users/resolve/${role}/${roleId}`);
        return response.data;
    },

    /**
     * Get current user's profile (from token)
     * Alias for authService.getProfile() - included for consistency
     */
    getMe: async (): Promise<User> => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    /**
     * Update user
     */
    update: async (authUserId: string, data: Partial<User>): Promise<User> => {
        const response = await api.put<User>(`/users/${authUserId}`, data);
        return response.data;
    },

    /**
     * Soft-delete user (sets status to 'inactive')
     */
    delete: async (authUserId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/users/${authUserId}`);
        return response.data;
    },

    /**
     * Helper: Check if user is active (not soft-deleted)
     */
    isActive: (user: User): boolean => {
        return user.status !== 'inactive';
    },
};
