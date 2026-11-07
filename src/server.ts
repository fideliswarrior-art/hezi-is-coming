import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

// In-memory real-time sync state across devices on the network (Admin tablet/PC <-> Player phones)
interface SharedServerState {
  pelada: Record<string, unknown> | null;
  peladaUpdatedAt: number;
  hezi: Record<string, unknown> | null;
  heziUpdatedAt: number;
}

const sharedState: SharedServerState = {
  pelada: null,
  peladaUpdatedAt: 0,
  hezi: null,
  heziUpdatedAt: 0,
};

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
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/hezi-sync") {
        if (request.method === "GET") {
          return new Response(JSON.stringify(sharedState), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }
        if (request.method === "POST") {
          const body = (await request.json()) as Partial<SharedServerState>;
          if (
            body.pelada &&
            typeof body.peladaUpdatedAt === "number" &&
            body.peladaUpdatedAt >= sharedState.peladaUpdatedAt
          ) {
            sharedState.pelada = body.pelada;
            sharedState.peladaUpdatedAt = body.peladaUpdatedAt;
          }
          if (
            body.hezi &&
            typeof body.heziUpdatedAt === "number" &&
            body.heziUpdatedAt >= sharedState.heziUpdatedAt
          ) {
            sharedState.hezi = body.hezi;
            sharedState.heziUpdatedAt = body.heziUpdatedAt;
          }
          return new Response(JSON.stringify(sharedState), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
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
