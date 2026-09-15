/* ══════════════════════════════════════════════════════════════════════
   KV shim over node:sqlite — the worker's PONEGLYPH_STATE binding in Node.

   Structurally matches KVNamespace in worker/types.ts. Default journal mode
   (no WAL): the file lives on EFS in the container, where WAL's shared-memory
   coordination is not safe on a network filesystem.
   ══════════════════════════════════════════════════════════════════════ */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openStore(file) {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER)",
  );

  const now = () => Math.floor(Date.now() / 1000);

  return {
    async get(key) {
      const row = db.prepare("SELECT value, expires FROM kv WHERE key = ?").get(key);
      if (!row) return null;
      /* an expired row is absent — the worker never sees stale state */
      if (row.expires != null && row.expires <= now()) return null;
      return row.value;
    },

    async put(key, value, options) {
      const expires =
        options?.expiration != null
          ? options.expiration
          : options?.expirationTtl != null
            ? now() + options.expirationTtl
            : null;
      db.prepare("INSERT OR REPLACE INTO kv(key, value, expires) VALUES (?, ?, ?)").run(
        key,
        value,
        expires,
      );
    },

    async delete(key) {
      db.prepare("DELETE FROM kv WHERE key = ?").run(key);
    },

    /* unused by the worker today; kept to honour the KVNamespace contract */
    async list(options) {
      const prefix = options?.prefix ?? "";
      const limit = options?.limit ?? 1000;
      const like = prefix.replace(/[\\%_]/g, (c) => `\\${c}`) + "%";
      const rows = db
        .prepare("SELECT key FROM kv WHERE key LIKE ? ESCAPE '\\' ORDER BY key LIMIT ?")
        .all(like, limit);
      return { keys: rows.map((r) => ({ name: r.key })), list_complete: true };
    },
  };
}
