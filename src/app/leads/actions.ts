"use server";
import { revalidatePath } from "next/cache";
import { sql, STATUSES, ACTIVITY_TYPES, OUTCOMES } from "@/lib/db";

const validStatus = (s: string) => STATUSES.some((x) => x.key === s);

export async function bulkSetStatus(ids: number[], status: string) {
  if (!validStatus(status) || !ids.length) return;
  await sql()`UPDATE leads SET status = ${status}, updated_at = now() WHERE id = ANY(${ids})`;
  revalidatePath("/leads");
}

export async function bulkDelete(ids: number[]) {
  if (!ids.length) return;
  await sql()`DELETE FROM leads WHERE id = ANY(${ids})`;
  revalidatePath("/leads");
}

export async function updateLead(id: number, form: FormData) {
  const status = String(form.get("status") ?? "new");
  const follow = String(form.get("next_follow_up") ?? "") || null;
  const owner = String(form.get("owner") ?? "") || null;
  const notes = String(form.get("notes") ?? "") || null;
  if (!validStatus(status)) return;
  await sql()`UPDATE leads SET status = ${status}, next_follow_up = ${follow}, owner = ${owner}, notes = ${notes}, updated_at = now()
              WHERE id = ${id}`;
  revalidatePath(`/leads/${id}`);
}

/** Log a call / door knock / etc. Outcome auto-advances the pipeline stage. */
export async function logActivity(id: number, form: FormData) {
  const type = String(form.get("type") ?? "call");
  const outcome = String(form.get("outcome") ?? "") || null;
  const notes = String(form.get("notes") ?? "") || null;
  const follow = String(form.get("next_follow_up") ?? "") || null;
  if (!ACTIVITY_TYPES.some((t) => t.key === type)) return;
  if (outcome && !OUTCOMES.some((o) => o.key === outcome)) return;

  const db = sql();
  await db`INSERT INTO activities (lead_id, type, outcome, notes) VALUES (${id}, ${type}, ${outcome}, ${notes})`;

  const next =
    outcome === "meeting_set" ? "meeting_set"
    : outcome === "do_not_contact" ? "do_not_contact"
    : outcome === "not_interested" ? "lost"
    : outcome === "interested" || outcome === "callback" ? "follow_up"
    : "contacted";
  // Only move forward from early stages; never override won/proposal/meeting with a weaker status.
  await db`UPDATE leads SET
      status = CASE WHEN status IN ('new','researching','contacted','follow_up') OR ${next}::text IN ('do_not_contact','meeting_set') THEN ${next}::text ELSE status END,
      next_follow_up = COALESCE(${follow}::date, next_follow_up),
      updated_at = now()
    WHERE id = ${id}`;
  revalidatePath(`/leads/${id}`);
}

export async function deleteActivity(leadId: number, activityId: number) {
  await sql()`DELETE FROM activities WHERE id = ${activityId} AND lead_id = ${leadId}`;
  revalidatePath(`/leads/${leadId}`);
}
