// データベースの型定義
export interface DatabaseManager {
  prepare(sql: string): any;
  exec(sql: string): void;
}

const getDb = (): DatabaseManager => {
  // Cloudflare D1 (本番環境) の存在を先にチェック
  // この環境変数が存在する場合、エッジ環境であるため Node.js のモジュールは読み込まない
  const d1 = (process.env as any).DB;
  if (d1) {
    return d1;
  }

  // ローカル開発環境 (Node.js) のためのロジック
  // runtime が edge の場合はこのブロック全体がコンパイラによって無視されるようにする
  if (process.env.NEXT_RUNTIME !== 'edge') {
    try {
      // require をトップレベルではなく、実行時にのみ解決させる
      const Database = require('better-sqlite3');
      const path = require('path');
      
      // process.cwd() をエッジ環境の解析から隠す
      const nodeProcess = typeof process !== 'undefined' ? process : null;
      const cwd = nodeProcess?.cwd ? (nodeProcess as any).cwd() : '';
      const DB_PATH = path.join(cwd, 'catmash.db');
      
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
      // エッジ側で誤ってここに来ても無視するように安全策
    }
  }

  throw new Error('Database is not initialized or not supported in this environment');
};

export default getDb;
