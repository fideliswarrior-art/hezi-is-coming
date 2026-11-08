import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  loadFullSyncStateFromDb,
  saveHeziStateToDb,
  savePeladaStateToDb,
  getDbStatusSummary,
  resetDbToFactorySeed,
} from "./lib/db/sqlite";
import type { HeziUser, HeziEventItem } from "./lib/hezi/store";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

interface SyncPayloadBody {
  pelada?: Record<string, unknown> | null;
  peladaUpdatedAt?: number;
  hezi?: {
    lastModified?: number;
    users?: HeziUser[];
    evs?: HeziEventItem[];
  } | null;
  heziUpdatedAt?: number;
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(
    consumeLastCapturedError() ??
      new Error(`h3 swallowed SSR error: ${body}`),
  );
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // 1. Real-time Sync Endpoint backed by SQLite Database (data/hezi.sqlite)
      if (url.pathname === "/api/hezi-sync") {
        if (request.method === "GET") {
          const current = loadFullSyncStateFromDb();
          return new Response(JSON.stringify(current), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }

        if (request.method === "POST") {
          const body = (await request.json()) as SyncPayloadBody;
          const current = loadFullSyncStateFromDb();

          if (
            body.pelada &&
            typeof body.peladaUpdatedAt === "number" &&
            body.peladaUpdatedAt >= current.peladaUpdatedAt
          ) {
            savePeladaStateToDb(body.pelada, body.peladaUpdatedAt);
          }

          if (
            body.hezi &&
            typeof body.heziUpdatedAt === "number" &&
            body.heziUpdatedAt >= current.heziUpdatedAt
          ) {
            saveHeziStateToDb(body.hezi, body.heziUpdatedAt);
          }

          const updated = loadFullSyncStateFromDb();
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }
      }

      // 2. Database Inspector & Admin Management Endpoint (/api/hezi-db)
      if (url.pathname === "/api/hezi-db") {
        if (request.method === "GET") {
          const summary = getDbStatusSummary();
          return new Response(JSON.stringify(summary), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }

        if (request.method === "POST") {
          const body = (await request.json()) as { action?: string };
          if (body.action === "reset") {
            const state = resetDbToFactorySeed();
            const summary = getDbStatusSummary();
            return new Response(JSON.stringify({ ok: true, state, summary }), {
              status: 200,
              headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
              },
            });
          }
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
