import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TableName = keyof Database['public']['Tables'];

/**
 * Tenant-aware Supabase helpers
 * These utilities ensure all queries are properly scoped by school_id for multi-tenancy
 */

/** Always scope by school_id when reading a tenant-scoped table */
export const selectByTenant = <T extends TableName>(
  table: T, 
  schoolId: string
) => {
  return supabase
    .from(table as any)
    .select("*")
    .eq("school_id", schoolId);
};

/** Insert with school_id injected */
export const insertWithTenant = <T extends TableName>(
  table: T,
  payload: Record<string, any>,
  schoolId: string
) => {
  return supabase
    .from(table as any)
    .insert([{ ...payload, school_id: schoolId }]);
};

/** Update enforcing tenant scope */
export const updateByTenant = <T extends TableName>(
  table: T,
  idCol: string,
  id: string,
  schoolId: string,
  patch: Record<string, any>
) => {
  return supabase
    .from(table as any)
    .update(patch)
    .eq(idCol, id)
    .eq("school_id", schoolId);
};

/** Delete enforcing tenant scope */
export const deleteByTenant = <T extends TableName>(
  table: T,
  idCol: string,
  id: string,
  schoolId: string
) => {
  return supabase
    .from(table as any)
    .delete()
    .eq(idCol, id)
    .eq("school_id", schoolId);
};
