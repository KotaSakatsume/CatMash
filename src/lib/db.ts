// データベースの型定義
export interface DatabaseManager {
  prepare(sql: string): any;
  exec(sql: string): void;
}

// --- ここで本番 (Cloudflare D1) か ローカル (SQLite) かを判定 ---

const getDb = (): DatabaseManager => {
  // Cloudflare D1 が存在する場合 (本番環境)
  const d1 = (process.env as any).DB;
  if (d1) {
    return d1;
  }

  // ローカル環境用 (Node.js環境でのみ実行されるように動的インポートを使用)
  // これにより Cloudflare Pages の Edge Runtime ビルドエラーを回避します
  if (typeof window === 'undefined') {
    try {
      // Node.js固有のモジュールを動的に読み込む (Edgeコンパイラから隠す)
      const _require = eval('require');
      const Database = _require('better-sqlite3');
      const path = _require('path');
      
      const DB_PATH = path.join(process.cwd(), 'catmash.db');
      
      const globalForDb = global as unknown as { db: any };
      if (!globalForDb.db) {
        const localDb = new Database(DB_PATH);
        
        // テーブルの初期化
        localDb.exec(`
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
          localDb.prepare('SELECT hash FROM cats LIMIT 1').get();
        } catch (e) {
          localDb.exec('ALTER TABLE cats ADD COLUMN hash TEXT');
          localDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_cats_hash ON cats(hash)');
        }
        
        globalForDb.db = localDb;
      }
      return globalForDb.db;
    } catch (e) {
      console.warn('Local database could not be initialized:', e);
    }
  }

  throw new Error('Database is not available in this environment');
};

export default getDb;
