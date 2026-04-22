export interface Cat {
  id: string;
  name: string;
  url: string;
  elo: number;
  wins: number;
  losses: number;
}

export interface DatabaseManager {
  prepare(sql: string): {
    bind(...args: string[]): {
      first<T>(): Promise<T | null>;
      all<T>(): Promise<{ results: T[] }>;
    };
    all<T>(): Promise<{ results: T[] }>;
    get<T>(...args: string[]): Promise<T | null>;
    first<T>(): Promise<T | null>;
  };
  exec(sql: string): Promise<void>;
}

const getDb = (): DatabaseManager => {
  const d1 = (process.env as unknown as { DB: DatabaseManager }).DB;
  if (!d1) {
    throw new Error('D1 Binding "DB" is missing. Please check your Cloudflare Pages settings.');
  }
  return d1;
};

export default getDb;
