import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiRequestSchema, generateAiInsight } from "@/lib/ai/insights";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = aiRequestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid AI request." }, { status: 400 });
  }

  try {
    const result = await generateAiInsight(payload.data.type, payload.data.data);

    if (payload.data.type === "symptom_insight" && payload.data.logId && typeof result === "string") {
      const supabase = await getSupabaseServerClient();
      const { data: log, error: logError } = await supabase
        .from("symptom_logs")
        .select("id")
        .eq("id", payload.data.logId)
        .eq("patient_id", user.id)
        .maybeSingle();

      if (logError) {
        return NextResponse.json({ error: logError.message }, { status: 400 });
      }

      if (!log) {
        return NextResponse.json({ error: "Symptom log not found." }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from("symptom_logs")
        .update({ ai_insight: result })
        .eq("id", payload.data.logId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate insight.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
