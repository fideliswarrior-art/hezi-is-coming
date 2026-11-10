import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import {
  U0,
  E0,
  baseSub,
  mkR,
  B0,
  ovr,
  type HeziUser,
  type HeziEventItem,
  type HeziNotification,
  type CatKey,
  type NanoKey,
  type BadgeState,
} from "../hezi/store";

type SqliteStatement = {
  run: (...args: unknown[]) => unknown;
  get: (...args: unknown[]) => unknown;
  all: (...args: unknown[]) => unknown[];
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
};

function resolveDataDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "hezi-data");
  }
  return path.resolve(process.cwd(), "data");
}

const DATA_DIR = resolveDataDir();
const DB_PATH = path.join(DATA_DIR, "hezi.sqlite");

let dbInstance: SqliteDatabase | null = null;
let sqliteUnavailable = false;
const stmtCache = new Map<string, SqliteStatement>();

function prepareCached(db: SqliteDatabase, sql: string): SqliteStatement {
  const cached = stmtCache.get(sql);
  if (cached) return cached;
  const stmt = db.prepare(sql);
  stmtCache.set(sql, stmt);
  return stmt;
}

// In-memory fallback for serverless/edge environments where node:sqlite isn't available
const memoryFallback = {
  users: structuredClone(U0) as HeziUser[],
  evs: structuredClone(E0) as HeziEventItem[],
  notifications: [] as HeziNotification[],
  heziUpdatedAt: 0,
  pelada: null as Record<string, unknown> | null,
  peladaUpdatedAt: 0,
  evaluationsHistory: [] as EvaluationHistoryRow[],
};

export interface EvaluationHistoryRow {
  id: number;
  userId: number;
  userName: string;
  evalDate: string;
  cycle: string;
  ovrBefore: number;
  ovrAfter: number;
  notaTecnica: string;
  createdAt: number;
}

export interface DbStatusSummary {
  engine: string;
  dbPath: string;
  fileSizeBytes: number;
  counts: {
    users: number;
    alunos: number;
    jogadores: number;
    events: number;
    queueEntries: number;
    evaluationsHistory: number;
  };
  heziUpdatedAt: number;
  peladaUpdatedAt: number;
  recentEvaluations: EvaluationHistoryRow[];
}

function getDb(): SqliteDatabase | null {
  if (sqliteUnavailable) return null;
  if (dbInstance) return dbInstance;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const req = createRequire(import.meta.url);
    const sqliteMod = req("node:sqlite") as {
      DatabaseSync: new (p: string) => SqliteDatabase;
    };
    const db = new sqliteMod.DatabaseSync(DB_PATH);

    // High-throughput "Tanque de Guerra" SQLite PRAGMAs
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA busy_timeout = 10000;");
    db.exec("PRAGMA cache_size = -64000;"); // 64MB RAM page cache
    db.exec("PRAGMA temp_store = MEMORY;");
    db.exec("PRAGMA mmap_size = 268435456;"); // 256MB memory-mapped I/O
    db.exec("PRAGMA wal_autocheckpoint = 1000;");
    db.exec("PRAGMA foreign_keys = ON;");

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        tipo TEXT NOT NULL CHECK (tipo IN ('aluno', 'jogador')),
        nome TEXT NOT NULL,
        pos TEXT NOT NULL,
        st TEXT CHECK (st IN ('ativo', 'inativo')),
        hp INTEGER NOT NULL DEFAULT 0,
        ofensiva INTEGER NOT NULL DEFAULT 0,
        foto TEXT,
        wpp TEXT,
        sub_json TEXT,
        nano_json TEXT,
        badges_json TEXT,
        last_eval_date TEXT,
        last_eval_cycle TEXT,
        nota_tecnica TEXT,
        profile_json TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evaluations_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        eval_date TEXT NOT NULL,
        cycle TEXT NOT NULL,
        ovr_before INTEGER NOT NULL,
        ovr_after INTEGER NOT NULL,
        sub_json TEXT NOT NULL,
        nano_json TEXT NOT NULL,
        badges_json TEXT NOT NULL,
        nota_tecnica TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY,
        titulo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        quando TEXT NOT NULL,
        local TEXT NOT NULL,
        regras TEXT NOT NULL,
        rewarded_uids_json TEXT NOT NULL DEFAULT '[]',
        ao_vivo_agora INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_queue (
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        joined_at INTEGER NOT NULL,
        PRIMARY KEY (event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS event_rewarded_users (
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rewarded_at INTEGER NOT NULL,
        PRIMARY KEY (event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS pelada_totem_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payload_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payload_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Safe schema migrations for existing databases
    const safeMigrations = [
      "ALTER TABLE users ADD COLUMN profile_json TEXT;",
      "ALTER TABLE events ADD COLUMN rewarded_uids_json TEXT NOT NULL DEFAULT '[]';",
      "ALTER TABLE events ADD COLUMN ao_vivo_agora INTEGER NOT NULL DEFAULT 0;",
      "CREATE INDEX IF NOT EXISTS idx_users_tipo_st ON users(tipo, st);",
      "CREATE INDEX IF NOT EXISTS idx_users_hp_desc ON users(hp DESC);",
      "CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);",
      "CREATE INDEX IF NOT EXISTS idx_eval_history_user_created ON evaluations_history(user_id, created_at DESC);",
      "CREATE INDEX IF NOT EXISTS idx_event_queue_event_pos ON event_queue(event_id, position ASC);",
      "CREATE INDEX IF NOT EXISTS idx_event_rewarded_lookup ON event_rewarded_users(event_id, user_id);",
      "UPDATE events SET regras = 'Regras Fiba, 7 pontos ou 7 minutos' WHERE regras = 'Jogos até 12 pontos ou 10 min';",
    ];
    for (const sql of safeMigrations) {
      try {
        db.exec(sql);
      } catch {
        // Ignore if column/index already exists
      }
    }

    dbInstance = db;
    seedIfEmpty(db);
    return db;
  } catch {
    sqliteUnavailable = true;
    return null;
  }
}

function seedIfEmpty(db: SqliteDatabase) {
  const row = prepareCached(db, "SELECT COUNT(*) as cnt FROM users").get() as {
    cnt: number;
  };
  if (row && row.cnt > 0) return;

  const now = Date.now();
  saveHeziToDbInternal(db, U0, E0, now, true);
}

function saveHeziToDbInternal(
  db: SqliteDatabase,
  users: HeziUser[],
  evs: HeziEventItem[],
  updatedAt: number,
  isSeed = false,
) {
  const prevUsersMap = new Map<number, HeziUser>();
  if (!isSeed) {
    for (const u of readUsersFromDb(db)) {
      prevUsersMap.set(u.id, u);
    }
  }

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    const incomingIds = users.map((u) => u.id);
    if (incomingIds.length > 0) {
      const placeholders = incomingIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM users WHERE id NOT IN (${placeholders})`).run(
        ...incomingIds,
      );
    } else {
      db.exec("DELETE FROM users;");
    }

    const upsertUser = prepareCached(
      db,
      `
      INSERT INTO users (
        id, tipo, nome, pos, st, hp, ofensiva, foto, wpp,
        sub_json, nano_json, badges_json, last_eval_date, last_eval_cycle, nota_tecnica, profile_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tipo = excluded.tipo,
        nome = excluded.nome,
        pos = excluded.pos,
        st = excluded.st,
        hp = excluded.hp,
        ofensiva = excluded.ofensiva,
        foto = excluded.foto,
        wpp = excluded.wpp,
        sub_json = excluded.sub_json,
        nano_json = excluded.nano_json,
        badges_json = excluded.badges_json,
        last_eval_date = excluded.last_eval_date,
        last_eval_cycle = excluded.last_eval_cycle,
        nota_tecnica = excluded.nota_tecnica,
        profile_json = excluded.profile_json,
        updated_at = excluded.updated_at
    `,
    );

    const insertEvalHistory = prepareCached(
      db,
      `
      INSERT INTO evaluations_history (
        user_id, user_name, eval_date, cycle, ovr_before, ovr_after,
        sub_json, nano_json, badges_json, nota_tecnica, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    );

    for (const u of users) {
      const subJson = u.sub ? JSON.stringify(u.sub) : null;
      const nanoJson = u.r ? JSON.stringify(u.r) : null;
      const badgesJson = u.bd ? JSON.stringify(u.bd) : null;
      const profileJson = JSON.stringify({
        username: u.username,
        apelido: u.apelido,
        dataNascimento: u.dataNascimento,
        instagram: u.instagram,
        email: u.email,
        senha: u.senha,
        emailVerified: u.emailVerified ?? true,
        verificationCode: u.verificationCode,
        resetCode: u.resetCode,
        resetCodeExpiresAt: u.resetCodeExpiresAt,
        tipo: u.tipo,
        st: u.st,
        avatarIcon: u.avatarIcon,
      });

      const dbTipo = u.tipo === "aluno" ? "aluno" : "jogador";
      const dbSt = u.st === "ativo" ? "ativo" : u.st ? "inativo" : null;

      upsertUser.run(
        u.id,
        dbTipo,
        u.nome,
        u.pos ?? "",
        dbSt,
        u.hp ?? 0,
        u.of ?? 0,
        u.foto ?? null,
        u.wpp ?? null,
        subJson,
        nanoJson,
        badgesJson,
        u.ev?.d ?? null,
        u.ev?.c ?? null,
        u.nota ?? null,
        profileJson,
        updatedAt,
      );

      // If this student's evaluation changed, record in evaluations_history
      if (!isSeed && u.tipo === "aluno" && u.ev && u.sub) {
        const prev = prevUsersMap.get(u.id);
        const prevSubStr = prev?.sub ? JSON.stringify(prev.sub) : "";
        const prevNanoStr = prev?.r ? JSON.stringify(prev.r) : "";
        if (prevSubStr !== subJson || prevNanoStr !== nanoJson) {
          const ovrBefore = prev?.sub ? ovr(prev.sub) : 65;
          const ovrAfter = ovr(u.sub);
          insertEvalHistory.run(
            u.id,
            u.nome,
            u.ev.d,
            u.ev.c,
            ovrBefore,
            ovrAfter,
            subJson ?? JSON.stringify(baseSub),
            nanoJson ?? JSON.stringify(mkR(baseSub)),
            badgesJson ?? JSON.stringify(B0()),
            u.nota ?? "",
            updatedAt,
          );
        }
      }
    }

    // Read existing rewarded users per event so they are never lost
    const existingRewardedRows = prepareCached(
      db,
      "SELECT event_id, user_id FROM event_rewarded_users",
    ).all() as Array<{ event_id: number; user_id: number }>;
    const rewardedByEvent = new Map<number, Set<number>>();
    for (const r of existingRewardedRows) {
      const set = rewardedByEvent.get(Number(r.event_id)) ?? new Set<number>();
      set.add(Number(r.user_id));
      rewardedByEvent.set(Number(r.event_id), set);
    }

    // Sync events & event_queue
    db.exec("DELETE FROM event_queue;");
    db.exec("DELETE FROM events;");

    const insertEvent = prepareCached(
      db,
      `
      INSERT INTO events (id, titulo, tipo, quando, local, regras, rewarded_uids_json, ao_vivo_agora, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    );
    const insertQueue = prepareCached(
      db,
      `
      INSERT INTO event_queue (event_id, user_id, position, joined_at)
      VALUES (?, ?, ?, ?)
    `,
    );
    const insertRewarded = prepareCached(
      db,
      `
      INSERT OR IGNORE INTO event_rewarded_users (event_id, user_id, rewarded_at)
      VALUES (?, ?, ?)
    `,
    );

    for (const e of evs) {
      const mergedRewarded = new Set<number>(
        rewardedByEvent.get(e.id) ?? new Set<number>(),
      );
      for (const uid of e.rewardedUids ?? []) {
        mergedRewarded.add(uid);
      }
      for (const uid of e.f ?? []) {
        mergedRewarded.add(uid);
      }
      const rewardedArr = Array.from(mergedRewarded);

      insertEvent.run(
        e.id,
        e.t,
        e.tp,
        e.q,
        e.l,
        e.r,
        JSON.stringify(rewardedArr),
        e.aoVivoAgora ? 1 : 0,
        updatedAt,
      );

      const uniqueQueue = Array.from(new Set(e.f));
      uniqueQueue.forEach((uid, idx) => {
        insertQueue.run(e.id, uid, idx + 1, updatedAt);
      });

      rewardedArr.forEach((uid) => {
        insertRewarded.run(e.id, uid, updatedAt);
      });
    }

    prepareCached(
      db,
      `
      INSERT INTO sync_meta (key, updated_at) VALUES ('hezi', ?)
      ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at
    `,
    ).run(updatedAt);

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

function readUsersFromDb(db: SqliteDatabase): HeziUser[] {
  const rows = prepareCached(
    db,
    "SELECT * FROM users ORDER BY tipo ASC, id ASC",
  ).all() as Array<{
    id: number;
    tipo: "aluno" | "jogador";
    nome: string;
    pos: string;
    st: "ativo" | "inativo" | null;
    hp: number;
    ofensiva: number;
    foto: string | null;
    wpp: string | null;
    sub_json: string | null;
    nano_json: string | null;
    badges_json: string | null;
    last_eval_date: string | null;
    last_eval_cycle: string | null;
    nota_tecnica: string | null;
    profile_json?: string | null;
  }>;

  return rows.map((r) => {
    let extra: Partial<HeziUser> = {};
    if (r.profile_json) {
      try {
        extra = JSON.parse(r.profile_json) as Partial<HeziUser>;
      } catch {
        extra = {};
      }
    }
    const seedMatch = U0.find((x) => x.id === Number(r.id));
    const resolvedTipo = extra.tipo ?? r.tipo;
    const u: HeziUser = {
      id: Number(r.id),
      tipo: resolvedTipo,
      nome: r.nome,
      username:
        extra.username ??
        seedMatch?.username ??
        r.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, ""),
      pos: r.pos || undefined,
      hp: Number(r.hp),
      apelido: extra.apelido ?? seedMatch?.apelido,
      dataNascimento: extra.dataNascimento ?? seedMatch?.dataNascimento,
      instagram: extra.instagram ?? seedMatch?.instagram,
      email: extra.email ?? seedMatch?.email,
      senha: extra.senha ?? seedMatch?.senha,
      emailVerified: extra.emailVerified ?? true,
      verificationCode: extra.verificationCode,
      resetCode: extra.resetCode,
      resetCodeExpiresAt: extra.resetCodeExpiresAt,
      avatarIcon: extra.avatarIcon,
      foto: r.foto ?? undefined,
    };
    if (r.wpp) u.wpp = r.wpp;
    if (resolvedTipo === "aluno" || r.sub_json) {
      u.st = extra.st ?? (r.st === "inativo" ? "pendente" : r.st ?? "ativo");
      u.of = Number(r.ofensiva ?? 0);
      if (r.foto) u.foto = r.foto;
      u.sub = r.sub_json
        ? (JSON.parse(r.sub_json) as Record<CatKey, number>)
        : baseSub;
      u.r = r.nano_json
        ? (JSON.parse(r.nano_json) as Record<NanoKey, number>)
        : mkR(u.sub);
      u.bd = r.badges_json
        ? (JSON.parse(r.badges_json) as BadgeState)
        : B0();
      u.ev =
        r.last_eval_date && r.last_eval_cycle
          ? { d: r.last_eval_date, c: r.last_eval_cycle }
          : null;
      u.nota = r.nota_tecnica ?? "";
    }
    return u;
  });
}

function readEventsFromDb(db: SqliteDatabase): HeziEventItem[] {
  const evRows = prepareCached(
    db,
    "SELECT * FROM events ORDER BY id ASC",
  ).all() as Array<{
    id: number;
    titulo: string;
    tipo: string;
    quando: string;
    local: string;
    regras: string;
    rewarded_uids_json?: string;
    ao_vivo_agora?: number;
  }>;

  const qRows = prepareCached(
    db,
    "SELECT event_id, user_id FROM event_queue ORDER BY event_id ASC, position ASC",
  ).all() as Array<{ event_id: number; user_id: number }>;

  const rewRows = prepareCached(
    db,
    "SELECT event_id, user_id FROM event_rewarded_users",
  ).all() as Array<{ event_id: number; user_id: number }>;

  const qMap = new Map<number, number[]>();
  for (const q of qRows) {
    const list = qMap.get(Number(q.event_id)) ?? [];
    list.push(Number(q.user_id));
    qMap.set(Number(q.event_id), list);
  }

  const rewMap = new Map<number, Set<number>>();
  for (const rw of rewRows) {
    const set = rewMap.get(Number(rw.event_id)) ?? new Set<number>();
    set.add(Number(rw.user_id));
    rewMap.set(Number(rw.event_id), set);
  }

  return evRows.map((e) => {
    const eid = Number(e.id);
    const set = rewMap.get(eid) ?? new Set<number>();
    if (e.rewarded_uids_json) {
      try {
        const parsed = JSON.parse(e.rewarded_uids_json) as number[];
        if (Array.isArray(parsed)) {
          parsed.forEach((uid) => set.add(Number(uid)));
        }
      } catch {
        // Ignore
      }
    }
    return {
      id: eid,
      t: e.titulo,
      tp: e.tipo,
      q: e.quando,
      l: e.local,
      r: e.regras,
      f: qMap.get(eid) ?? [],
      rewardedUids: Array.from(set),
      aoVivoAgora: Boolean(e.ao_vivo_agora),
    };
  });
}

export function loadFullSyncStateFromDb() {
  const db = getDb();
  if (!db) {
    return {
      pelada: memoryFallback.pelada,
      peladaUpdatedAt: memoryFallback.peladaUpdatedAt,
      hezi: {
        lastModified: memoryFallback.heziUpdatedAt,
        users: memoryFallback.users,
        evs: memoryFallback.evs,
        notifications: memoryFallback.notifications,
      },
      heziUpdatedAt: memoryFallback.heziUpdatedAt,
    };
  }

  const heziMeta = prepareCached(
    db,
    "SELECT updated_at FROM sync_meta WHERE key = 'hezi'",
  ).get() as { updated_at: number } | undefined;
  const heziUpdatedAt = heziMeta ? Number(heziMeta.updated_at) : 0;

  const users = readUsersFromDb(db);
  const evs = readEventsFromDb(db);

  const notifRow = prepareCached(
    db,
    "SELECT payload_json FROM notifications_state WHERE id = 1",
  ).get() as { payload_json: string } | undefined;
  let notifications: HeziNotification[] = [];
  if (notifRow?.payload_json) {
    try {
      notifications = JSON.parse(notifRow.payload_json) as HeziNotification[];
    } catch {
      notifications = [];
    }
  }

  const peladaRow = prepareCached(
    db,
    "SELECT payload_json, updated_at FROM pelada_totem_state WHERE id = 1",
  ).get() as { payload_json: string; updated_at: number } | undefined;

  return {
    pelada: peladaRow
      ? (JSON.parse(peladaRow.payload_json) as Record<string, unknown>)
      : null,
    peladaUpdatedAt: peladaRow ? Number(peladaRow.updated_at) : 0,
    hezi: {
      lastModified: heziUpdatedAt,
      users,
      evs,
      notifications,
    },
    heziUpdatedAt,
  };
}

export function saveHeziStateToDb(
  hezi: {
    users?: HeziUser[];
    evs?: HeziEventItem[];
    notifications?: HeziNotification[];
    lastModified?: number;
  },
  updatedAt: number,
) {
  const db = getDb();
  if (!db) {
    if (hezi.users) memoryFallback.users = hezi.users;
    if (hezi.evs) memoryFallback.evs = hezi.evs;
    if (hezi.notifications) memoryFallback.notifications = hezi.notifications;
    memoryFallback.heziUpdatedAt = updatedAt;
    return;
  }
  const currentUsers = hezi.users ?? readUsersFromDb(db);
  const currentEvs = hezi.evs ?? readEventsFromDb(db);
  saveHeziToDbInternal(db, currentUsers, currentEvs, updatedAt, false);
  if (hezi.notifications) {
    prepareCached(
      db,
      `
      INSERT INTO notifications_state (id, payload_json, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `,
    ).run(JSON.stringify(hezi.notifications.slice(0, 200)), updatedAt);
  }
}

export function savePeladaStateToDb(
  pelada: Record<string, unknown>,
  updatedAt: number,
) {
  const db = getDb();
  if (!db) {
    memoryFallback.pelada = pelada;
    memoryFallback.peladaUpdatedAt = updatedAt;
    return;
  }
  prepareCached(
    db,
    `
    INSERT INTO pelada_totem_state (id, payload_json, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
  `,
  ).run(JSON.stringify(pelada), updatedAt);

  prepareCached(
    db,
    `
    INSERT INTO sync_meta (key, updated_at) VALUES ('pelada', ?)
    ON CONFLICT(key) DO UPDATE SET updated_at = excluded.updated_at
  `,
  ).run(updatedAt);
}

export function resetDbToFactorySeed() {
  const db = getDb();
  const now = Date.now();
  if (!db) {
    memoryFallback.users = structuredClone(U0);
    memoryFallback.evs = structuredClone(E0);
    memoryFallback.notifications = [];
    memoryFallback.heziUpdatedAt = now;
    memoryFallback.pelada = null;
    memoryFallback.peladaUpdatedAt = 0;
    memoryFallback.evaluationsHistory = [];
    return loadFullSyncStateFromDb();
  }
  db.exec("DELETE FROM evaluations_history;");
  db.exec("DELETE FROM event_rewarded_users;");
  db.exec("DELETE FROM notifications_state;");
  db.exec("DELETE FROM pelada_totem_state;");
  db.exec("DELETE FROM sync_meta;");
  saveHeziToDbInternal(db, U0, E0, now, true);
  return loadFullSyncStateFromDb();
}

export function getDbStatusSummary(): DbStatusSummary {
  const db = getDb();
  if (!db) {
    const alunosCount = memoryFallback.users.filter(
      (u) => u.tipo === "aluno",
    ).length;
    const jogadoresCount = memoryFallback.users.filter(
      (u) => u.tipo !== "aluno",
    ).length;
    const queueCount = memoryFallback.evs.reduce(
      (acc, e) => acc + e.f.length,
      0,
    );
    return {
      engine:
        "High-Speed In-Memory Serverless Engine (WAL/Prepared Cache Ready)",
      dbPath: "memory://hezi",
      fileSizeBytes: 0,
      counts: {
        users: memoryFallback.users.length,
        alunos: alunosCount,
        jogadores: jogadoresCount,
        events: memoryFallback.evs.length,
        queueEntries: queueCount,
        evaluationsHistory: memoryFallback.evaluationsHistory.length,
      },
      heziUpdatedAt: memoryFallback.heziUpdatedAt,
      peladaUpdatedAt: memoryFallback.peladaUpdatedAt,
      recentEvaluations: memoryFallback.evaluationsHistory,
    };
  }

  let fileSizeBytes = 0;
  try {
    fileSizeBytes = fs.statSync(DB_PATH).size;
  } catch {
    fileSizeBytes = 0;
  }

  const usersCount = Number(
    (
      prepareCached(db, "SELECT COUNT(*) as c FROM users").get() as {
        c: number;
      }
    ).c,
  );
  const alunosCount = Number(
    (
      prepareCached(
        db,
        "SELECT COUNT(*) as c FROM users WHERE tipo = 'aluno'",
      ).get() as { c: number }
    ).c,
  );
  const jogadoresCount = Number(
    (
      prepareCached(
        db,
        "SELECT COUNT(*) as c FROM users WHERE tipo = 'jogador'",
      ).get() as { c: number }
    ).c,
  );
  const eventsCount = Number(
    (
      prepareCached(db, "SELECT COUNT(*) as c FROM events").get() as {
        c: number;
      }
    ).c,
  );
  const queueCount = Number(
    (
      prepareCached(db, "SELECT COUNT(*) as c FROM event_queue").get() as {
        c: number;
      }
    ).c,
  );
  const evalsCount = Number(
    (
      prepareCached(
        db,
        "SELECT COUNT(*) as c FROM evaluations_history",
      ).get() as {
        c: number;
      }
    ).c,
  );

  const heziMeta = prepareCached(
    db,
    "SELECT updated_at FROM sync_meta WHERE key = 'hezi'",
  ).get() as { updated_at: number } | undefined;
  const peladaMeta = prepareCached(
    db,
    "SELECT updated_at FROM sync_meta WHERE key = 'pelada'",
  ).get() as { updated_at: number } | undefined;

  const recentRows = prepareCached(
    db,
    "SELECT id, user_id, user_name, eval_date, cycle, ovr_before, ovr_after, nota_tecnica, created_at FROM evaluations_history ORDER BY id DESC LIMIT 15",
  ).all() as Array<{
    id: number;
    user_id: number;
    user_name: string;
    eval_date: string;
    cycle: string;
    ovr_before: number;
    ovr_after: number;
    nota_tecnica: string | null;
    created_at: number;
  }>;

  return {
    engine: `SQLite Tanque de Guerra (Node ${process.version} · WAL + 64MB Cache + MMAP 256MB + Índices B-Tree)`,
    dbPath: DB_PATH,
    fileSizeBytes,
    counts: {
      users: usersCount,
      alunos: alunosCount,
      jogadores: jogadoresCount,
      events: eventsCount,
      queueEntries: queueCount,
      evaluationsHistory: evalsCount,
    },
    heziUpdatedAt: heziMeta ? Number(heziMeta.updated_at) : 0,
    peladaUpdatedAt: peladaMeta ? Number(peladaMeta.updated_at) : 0,
    recentEvaluations: recentRows.map((r) => ({
      id: Number(r.id),
      userId: Number(r.user_id),
      userName: r.user_name,
      evalDate: r.eval_date,
      cycle: r.cycle,
      ovrBefore: Number(r.ovr_before),
      ovrAfter: Number(r.ovr_after),
      notaTecnica: r.nota_tecnica ?? "",
      createdAt: Number(r.created_at),
    })),
  };
}
