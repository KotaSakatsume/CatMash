import Database from 'better-sqlite3';
import path from 'path';

// データベースの型定義
export interface DatabaseManager {
  prepare(sql: string): any;
  exec(sql: string): void;
}

const DB_PATH = path.join(process.cwd(), 'catmash.db');

// ローカル用の初期設定ロジック
const initLocalDb = (db: any) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cats (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      hash TEXT,
      elo INTEGER DEFAULT 1200,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    db.prepare('SELECT hash FROM cats LIMIT 1').get();
  } catch (e) {
    db.exec('ALTER TABLE cats ADD COLUMN hash TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_cats_hash ON cats(hash)');
  }
};

// --- ここで本番 (Cloudflare D1) か ローカル (SQLite) かを判定 ---

let db: any;

const getDb = (): DatabaseManager => {
  // Cloudflare D1 が存在する場合 (本番環境)
  //注: Next.js + Cloudflare Pages では、process.env.DB にバインドされます
  const d1 = (process.env as any).DB;
  if (d1) {
    return d1;
  }

  // ローカル環境
  const globalForDb = global as unknown as { db: any };
  if (!globalForDb.db) {
    globalForDb.db = new Database(DB_PATH);
    initLocalDb(globalForDb.db);
  }
  return globalForDb.db;
};

export default getDb;
