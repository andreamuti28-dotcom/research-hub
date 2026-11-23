import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  reportId: z.string().uuid(),
});

/**
 * Re-format the Italian market report into the same markdown layout the EN
 * translator produces (headings, bold, bullet lists, paragraphs, tables). The
 * wording MUST stay exactly the same: only structural markdown is added.
 *
 * Public endpoint: it only accepts the id of a stored report, never arbitrary
 * text, so it cannot be used to spend the AI quota on someone else's content.
 */
export const formatMarketReportLayout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: report } = await supabaseAdmin
      .from("market_reports")
      .select("content")
      .eq("id", data.reportId)
      .maybeSingle();
    const { formatReportText } = await import("@/lib/format-layout.server");
    return formatReportText((report?.content as string | undefined) ?? "");
  });
