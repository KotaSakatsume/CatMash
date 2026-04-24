'use server';

import getDb, { Cat } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// 2匹のランダムな猫を取得
export async function getRandomMatchup(): Promise<[Cat, Cat]> {
  const db = getDb();
  const query = 'SELECT * FROM cats ORDER BY RANDOM() LIMIT 2';
  const result = await db.prepare(query).all<Cat>();
  
  // D1の結果は .results に配列が入る
  const cats = result.results;
  
  if (cats.length < 2) {
    // データが足りない場合のフォールバック（初期状態など）
    const dummyCat: Cat = { id: '0', name: 'Wait...', url: '', elo: 1200, wins: 0, losses: 0 };
    return [cats[0] || dummyCat, cats[1] || dummyCat] as [Cat, Cat];
  }
  
  return [cats[0], cats[1]] as [Cat, Cat];
}

// ランキングトップの猫を取得
export async function getLeaderboard(): Promise<Cat[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM cats ORDER BY elo DESC LIMIT 10').all<Cat>();
  return result.results;
}

// 投票結果を反映（Eloレーティング計算）
export async function vote(winnerId: string, loserId: string): Promise<void> {
  const db = getDb();
  
  try {
    // 最新のデータを取得
    const winner = await db.prepare('SELECT * FROM cats WHERE id = ?').bind(winnerId).first<Cat>();
    const loser = await db.prepare('SELECT * FROM cats WHERE id = ?').bind(loserId).first<Cat>();

    if (!winner || !loser) {
      console.error('Cats not found:', { winnerId, loserId });
      return;
    }

    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

    const newWinnerElo = Math.round(winner.elo + K * (1 - expectedWinner));
    const newLoserElo = Math.round(loser.elo + K * (0 - expectedLoser));

    // 個別に run() を実行して確実性を高める
    await db.prepare('UPDATE cats SET elo = ?, wins = wins + 1 WHERE id = ?').bind(newWinnerElo, winnerId).run();
    await db.prepare('UPDATE cats SET elo = ?, losses = losses + 1 WHERE id = ?').bind(newLoserElo, loserId).run();

    // キャッシュを強制クリア
    revalidatePath('/', 'layout');
    revalidatePath('/leaderboard');
  } catch (error) {
    console.error('Vote action error:', error);
    throw error;
  }
}

// 猫の追加
export async function addCat(name: string, url: string, hash?: string): Promise<void> {
  const db = getDb();
  const id = Math.random().toString(36).substring(7);
  try {
    await db.prepare('INSERT INTO cats (id, name, url, hash) VALUES (?, ?, ?, ?)').bind(id, name, url, hash || "").run();
    revalidatePath('/');
  } catch (error) {
    console.error('Add cat error:', error);
    throw error;
  }
}
