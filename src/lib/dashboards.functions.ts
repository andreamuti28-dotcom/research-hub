import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type DashboardRow = {
  id: string;
  component_key: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listPublishedDashboards = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("dashboards")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as DashboardRow[];
  },
);

export const listAllDashboards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("dashboards")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as DashboardRow[];
  });

const dashboardInputSchema = z.object({
  componentKey: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  descriptionEn: z.string().trim().max(1000).nullable().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const createDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dashboardInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("dashboards")
      .insert({
        component_key: data.componentKey,
        title: data.title,
        title_en: data.titleEn ?? null,
        description: data.description ?? null,
        description_en: data.descriptionEn ?? null,
        is_published: data.isPublished,
        sort_order: data.sortOrder,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as DashboardRow;
  });

export const updateDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    dashboardInputSchema.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const { data: row, error } = await supabaseAdmin
      .from("dashboards")
      .update({
        component_key: rest.componentKey,
        title: rest.title,
        title_en: rest.titleEn ?? null,
        description: rest.description ?? null,
        description_en: rest.descriptionEn ?? null,
        is_published: rest.isPublished,
        sort_order: rest.sortOrder,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as DashboardRow;
  });

export const deleteDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("dashboards")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
