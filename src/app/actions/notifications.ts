"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/rbac";

export async function sendBroadcastNotification(
  titles: Record<string, string>,
  bodies: Record<string, string>,
  data?: Record<string, unknown>
) {
  const admin = await isAdmin();
  if (!admin) {
    return { error: "Unauthorized" };
  }

  if (!titles.it?.trim() || !bodies.it?.trim()) {
    return { error: "Titolo e messaggio in italiano sono obbligatori" };
  }

  if (!titles.en?.trim() || !bodies.en?.trim()) {
    return { error: "Title and message in English are required (OneSignal)" };
  }

  const supabase = await createClient();

  // Build headings/contents: include only non-empty languages, fallback to IT
  const headings: Record<string, string> = {};
  const contents: Record<string, string> = {};

  for (const [lang, value] of Object.entries(titles)) {
    const trimmed = value.trim();
    if (trimmed) headings[lang] = trimmed;
  }

  for (const [lang, value] of Object.entries(bodies)) {
    const trimmed = value.trim();
    if (trimmed) contents[lang] = trimmed;
  }

  const notifData = (data ?? {}) as unknown as Record<string, never>;

  const { error: insertError } = await supabase
    .from("broadcast_notifications")
    .insert({
      headings: headings as unknown as Record<string, never>,
      contents: contents as unknown as Record<string, never>,
      data: notifData,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true };
}
