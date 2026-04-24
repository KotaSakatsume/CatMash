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
    bind(...args: any[]): {
      first<T>(column?: string): Promise<T | null>;
      all<T>(): Promise<{ results: T[] }>;
      run<T = any>(): Promise<{ success: boolean; meta: any }>;
      get<T>(...args: any[]): Promise<T | null>;
    };
    all<T>(): Promise<{ results: T[] }>;
    get<T>(...args: any[]): Promise<T | null>;
    first<T>(column?: string): Promise<T | null>;
    run<T = any>(): Promise<{ success: boolean; meta: any }>;
  };
  exec(sql: string): Promise<void>;
  batch<T = any>(statements: any[]): Promise<any[]>;
}

const getDb = (): DatabaseManager => {
  const d1 = (process.env as unknown as { DB: DatabaseManager }).DB;
  if (!d1) {
    throw new Error('D1 Binding "DB" is missing. Please check your Cloudflare Pages settings.');
  }
  return d1;
};

export default getDb;
