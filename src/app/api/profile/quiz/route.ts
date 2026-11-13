import { NextResponse } from "next/server";
import { saveProfileCookie, getStudentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      score?: number;
      total?: number;
      title?: string;
    };

    const score = Number(body.score) || 0;
    const total = Number(body.total) || 0;
    if (total <= 0) {
      return NextResponse.json({ error: "Invalid quiz total" }, { status: 400 });
    }

    const currentProfile = await getStudentProfile();
    const prevScore = currentProfile.quiz_score || 0;
    const prevTotal = currentProfile.quiz_total || 0;

    const newScore = prevScore + score;
    const newTotal = prevTotal + total;

    const historyItem = {
      date: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: body.title || "Lesson Quiz",
      score,
      total,
      percentage: Math.round((score / total) * 100),
    };

    const prevHistory = currentProfile.quiz_history || [];
    const newHistory = [historyItem, ...prevHistory].slice(0, 15);

    // Save to cookie
    const updated = await saveProfileCookie({
      quiz_score: newScore,
      quiz_total: newTotal,
      quiz_history: newHistory,
    });

    // Also update Supabase if signed in
    const supabase = await createClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            quiz_score: newScore,
            quiz_total: newTotal,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        /* supabase fallback */
      }
    }

    return NextResponse.json({
      success: true,
      profile: updated,
      newScore,
      newTotal,
      percentage: Math.round((newScore / Math.max(1, newTotal)) * 100),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record quiz score" },
      { status: 500 }
    );
  }
}
