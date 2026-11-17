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
import {
  saveHeziToSupabase,
  savePeladaToSupabase,
  loadFullSyncStateFromSupabase,
  upsertSingleUserInSupabase,
  deleteSingleUserInSupabase,
  mutateEventQueueInSupabase,
  resetPeladaInSupabase,
} from "./lib/db/supabase";
import { hashPassword, isPasswordHashed, verifyPassword } from "./lib/hezi/security";

function sanitizeSyncPayload(payload: any) {
  if (!payload || !payload.hezi || !Array.isArray(payload.hezi.users)) return payload;
  return {
    ...payload,
    hezi: {
      ...payload.hezi,
      users: payload.hezi.users.map((u: any) => {
        const { senha: _s, verificationCode: _v, resetCode: _r, ...safeUser } = u;
        return safeUser;
      }),
    },
  };
}
import type {
  HeziUser,
  HeziEventItem,
  HeziNotification,
} from "./lib/hezi/store";

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
    notifications?: HeziNotification[];
  } | null;
  heziUpdatedAt?: number;
}

interface AuthEmailPayload {
  action: "send_verification" | "send_password_reset";
  email: string;
  nome?: string;
  username?: string;
  code: string;
}

async function sendTransactionalEmail(payload: AuthEmailPayload): Promise<{
  ok: boolean;
  deliveredVia: "resend" | "instant_preview";
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.HEZI_EMAIL_FROM || "HEZI FAM <contato@hezi.com.br>";

  const isVerify = payload.action === "send_verification";
  const subject = isVerify
    ? `Código de ativação da sua conta HEZI FAM: ${payload.code}`
    : `Recuperação de senha HEZI FAM: código ${payload.code}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #111317; color: #ffffff; padding: 28px; border-radius: 16px;">
      <h2 style="color: #FF5400; margin-top: 0;">HEZI FAM® — Moving the game.</h2>
      <p style="font-size: 15px; line-height: 1.5;">Olá${payload.nome ? `, <strong>${payload.nome}</strong>` : ""}!</p>
      <p style="font-size: 14px; color: #D1D5DB; line-height: 1.5;">
        ${
          isVerify
            ? "Use o código de confirmação abaixo para ativar sua conta oficial na plataforma HEZI FAM:"
            : "Recebemos uma solicitação para redefinir a senha da sua conta HEZI FAM. Use o código abaixo para criar sua nova senha:"
        }
      </p>
      <div style="background: #1F242D; border: 2px solid #FF5400; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #ffffff;">${payload.code}</span>
      </div>
      <p style="font-size: 12px; color: #9CA3AF;">
        Suporte oficial WhatsApp HEZI®
      </p>
    </div>
  `;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.email],
          subject,
          html,
        }),
      });
      if (res.ok) {
        return { ok: true, deliveredVia: "resend" };
      }
    } catch {
      // Fallback to instant preview if email provider fails
    }
  }

  return { ok: true, deliveredVia: "instant_preview" };
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

      // 1. Real-time Sync Endpoint backed by Supabase Cloud (Primary) & SQLite Cache
      if (url.pathname === "/api/hezi-sync") {
        if (request.method === "GET") {
          let current: any = null;
          try {
            current = await loadFullSyncStateFromSupabase();
          } catch {
            /* fallback to sqlite */
          }

          if (!current || !current.hezi) {
            current = loadFullSyncStateFromDb();
          } else {
            // Mantem o SQLite/memoria aquecido com o estado oficial do Supabase
            if (current.hezi && current.heziUpdatedAt > 0) {
              saveHeziStateToDb(current.hezi, current.heziUpdatedAt);
            }
            if (current.pelada && current.peladaUpdatedAt > 0) {
              savePeladaStateToDb(current.pelada, current.peladaUpdatedAt);
            }
          }

          return new Response(JSON.stringify(sanitizeSyncPayload(current)), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }

        if (request.method === "POST") {
          const body = (await request.json()) as SyncPayloadBody;

          if (body.pelada && typeof body.peladaUpdatedAt === "number") {
            savePeladaStateToDb(body.pelada, body.peladaUpdatedAt);
            await savePeladaToSupabase(body.pelada, body.peladaUpdatedAt);
          }

          if (body.hezi && typeof body.heziUpdatedAt === "number") {
            saveHeziStateToDb(body.hezi, body.heziUpdatedAt);
            await saveHeziToSupabase(body.hezi, body.heziUpdatedAt);
          }

          let updated: any = null;
          try {
            updated = await loadFullSyncStateFromSupabase();
          } catch {
            /* fallback */
          }
          if (!updated || !updated.hezi) {
            updated = loadFullSyncStateFromDb();
          }

          return new Response(JSON.stringify(sanitizeSyncPayload(updated)), {
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
          const summary: any = getDbStatusSummary();
          try {
            const remote = await loadFullSyncStateFromSupabase();
            if (remote?.hezi) {
              const u = Array.isArray(remote.hezi.users) ? remote.hezi.users : [];
              const evs = Array.isArray(remote.hezi.evs) ? remote.hezi.evs : [];
              const totalQueue = evs.reduce((acc: number, e: any) => acc + (Array.isArray(e.f) ? e.f.length : 0), 0);
              summary.usersCount = u.length;
              summary.alunosCount = u.filter((x: any) => x.tipo === "aluno").length;
              summary.jogadoresCount = u.filter((x: any) => x.tipo !== "aluno").length;
              summary.eventsCount = evs.length;
              summary.queueCount = totalQueue;
            }
          } catch {
            /* fallback para summary local */
          }
          return new Response(JSON.stringify(summary), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }

        if (request.method === "POST") {
          return new Response(
            JSON.stringify({ error: "Ação desativada por segurança em produção." }),
            { status: 403, headers: { "content-type": "application/json" } },
          );
        }
      }

      // 3. Transactional Email Endpoint for Account Activation & Password Reset (/api/hezi-auth)
      if (url.pathname === "/api/hezi-auth" && request.method === "POST") {
        const body = (await request.json()) as AuthEmailPayload;
        const result = await sendTransactionalEmail(body);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      }

      // 4. Granular Entity Endpoints (/api/hezi/*)
      if (url.pathname === "/api/hezi/users/upsert" && request.method === "POST") {
        const { user } = (await request.json()) as { user: any };
        const ok = user?.id ? await upsertSingleUserInSupabase(user) : false;
        return new Response(JSON.stringify({ ok }), {
          status: ok ? 200 : 400,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      }

      if (url.pathname === "/api/hezi/users/delete" && request.method === "POST") {
        const { userId } = (await request.json()) as { userId: number };
        const ok = typeof userId === "number" ? await deleteSingleUserInSupabase(userId) : false;
        return new Response(JSON.stringify({ ok }), {
          status: ok ? 200 : 400,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      }

      if (url.pathname === "/api/hezi/events/queue" && request.method === "POST") {
        const { eventId, userId, action } = (await request.json()) as {
          eventId: number;
          userId: number;
          action: "join" | "leave";
        };
        const event =
          typeof eventId === "number" && typeof userId === "number"
            ? await mutateEventQueueInSupabase(eventId, userId, action)
            : null;
        return new Response(JSON.stringify({ ok: Boolean(event), event }), {
          status: event ? 200 : 404,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      }

      if (url.pathname === "/api/hezi/pelada/reset" && request.method === "POST") {
        const ok = await resetPeladaInSupabase();
        return new Response(JSON.stringify({ ok }), {
          status: ok ? 200 : 500,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      }

      // 5. Server-side Session Cookie & Credential Verification (/api/hezi/auth/login & logout)
      if (url.pathname === "/api/hezi/auth/login" && request.method === "POST") {
        const body = (await request.json()) as {
          sid?: string | number;
          role?: string;
          identifier?: string;
          senha?: string;
        };

        let resolvedSid = body.sid;
        let resolvedRole = body.role || "user";

        if (body.identifier && body.senha) {
          const clean = body.identifier.trim().toLowerCase().replace(/^@+/, "");
          const remote = await loadFullSyncStateFromSupabase();
          const usersList: any[] = Array.isArray(remote?.hezi?.users) ? remote.hezi.users : [];
          const found = usersList.find((u) => {
            const em = (u.email || "").trim().toLowerCase();
            const un = (u.username || "").trim().toLowerCase().replace(/^@+/, "");
            const ap = (u.apelido || "").trim().toLowerCase();
            return (em && em === clean) || (un && un === clean) || (ap && ap === clean);
          });
          if (!found || !(await verifyPassword(body.senha, found.senha ?? "Hezi@2026"))) {
            return new Response(JSON.stringify({ ok: false }), {
              status: 401,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            });
          }
          if (!isPasswordHashed(found.senha)) {
            const hashed = await hashPassword(body.senha);
            await upsertSingleUserInSupabase({ ...found, senha: hashed });
          }
          resolvedSid = found.id;
          resolvedRole = found.isModerator ? "admin" : found.tipo;
        }

        const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const payload = Buffer.from(
          JSON.stringify({ sid: resolvedSid, role: resolvedRole, exp }),
        ).toString("base64url");
        return new Response(JSON.stringify({ ok: true, userId: resolvedSid }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "set-cookie": `hezi_session=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
          },
        });
      }

      if (url.pathname === "/api/hezi/auth/logout" && request.method === "POST") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "set-cookie": "hezi_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
          },
        });
      }

      // 6. Production Error Telemetry Endpoint (/api/hezi/telemetry/error)
      if (url.pathname === "/api/hezi/telemetry/error" && request.method === "POST") {
        try {
          const errBody = await request.json();
          console.error("[HEZI_CLIENT_ERROR]", JSON.stringify(errBody));
        } catch {
          /* ignore malformed telemetry */
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
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
