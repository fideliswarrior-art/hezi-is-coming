import type { HeziEventItem, HeziUser } from "./store";

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function upsertUserApi(user: HeziUser) {
  return postJson<{ ok: boolean }>("/api/hezi/users/upsert", { user });
}

export function deleteUserApi(userId: number) {
  return postJson<{ ok: boolean }>("/api/hezi/users/delete", { userId });
}

export function eventQueueApi(
  eventId: number,
  userId: number,
  action: "join" | "leave",
) {
  return postJson<{ ok: boolean; event?: HeziEventItem }>(
    "/api/hezi/events/queue",
    { eventId, userId, action },
  );
}
