export interface DatabaseManager {
  prepare(sql: string): any;
  exec(sql: string): void;
}

const getDb = (): DatabaseManager => {
  const d1 = (process.env as any).DB;
  if (!d1) {
    // 本番環境でDBが見つからない場合に分かりやすいエラーを出す
    throw new Error('D1 Binding "DB" is missing. Please check your Cloudflare Pages settings.');
  }
  return d1;
};

export default getDb;
