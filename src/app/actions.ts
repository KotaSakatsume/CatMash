'use server';

import getDb from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface Cat {
  id: string;
  name: string;
  url: string;
  elo: number;
  wins: number;
  losses: number;
}

// 2匹のランダムな猫を取得
export async function getRandomMatchup() {
  const db = getDb();
  // D1とbetter-sqlite3の両方の差分を吸収するために await を使用
  const query = 'SELECT * FROM cats ORDER BY RANDOM() LIMIT 2';
  const result = await db.prepare(query).all();
  
  // D1の場合は .results にデータが入ることがあるためケア
  const cats = (result.results || result) as Cat[];
  return cats as [Cat, Cat];
}

// ランキングトップの猫を取得
export async function getLeaderboard() {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM cats ORDER BY elo DESC LIMIT 10').all();
  return (result.results || result) as Cat[];
}

// 投票結果を反映（Eloレーティング計算）
export async function vote(winnerId: string, loserId: string) {
  const db = getDb();
  
  const winnerQuery = db.prepare('SELECT * FROM cats WHERE id = ?');
  const winner = await (winnerQuery.first ? winnerQuery.bind(winnerId).first() : Promise.resolve(winnerQuery.get(winnerId)));
  
  const loserQuery = db.prepare('SELECT * FROM cats WHERE id = ?');
  const loser = await (loserQuery.first ? loserQuery.bind(loserId).first() : Promise.resolve(loserQuery.get(loserId)));

  if (!winner || !loser) return;

  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

  const newWinnerElo = Math.round(winner.elo + K * (1 - expectedWinner));
  const newLoserElo = Math.round(loser.elo + K * (0 - expectedLoser));

  // 書き込み処理
  const updateWinner = db.prepare('UPDATE cats SET elo = ?, wins = wins + 1 WHERE id = ?');
  if (updateWinner.run) {
    if (updateWinner.bind && (db as any).batch) { // D1 check
      await updateWinner.bind(newWinnerElo, winnerId).run();
    } else { // better-sqlite3
      updateWinner.run(newWinnerElo, winnerId);
    }
  }
  
  const updateLoser = db.prepare('UPDATE cats SET elo = ?, losses = losses + 1 WHERE id = ?');
  if (updateLoser.run) {
    if (updateLoser.bind && (db as any).batch) { // D1 check
      await updateLoser.bind(newLoserElo, loserId).run();
    } else { // better-sqlite3
      updateLoser.run(newLoserElo, loserId);
    }
  }

  revalidatePath('/');
  revalidatePath('/leaderboard');
}

// 猫の追加
export async function addCat(name: string, url: string, hash?: string) {
  const db = getDb();
  const id = Math.random().toString(36).substring(7);
  const insertStmt = db.prepare('INSERT INTO cats (id, name, url, hash) VALUES (?, ?, ?, ?)');
  
  if (insertStmt.run) {
    if (insertStmt.bind && (db as any).batch) { // D1 check
      await insertStmt.bind(id, name, url, hash || null).run();
    } else { // better-sqlite3
      insertStmt.run(id, name, url, hash || null);
    }
  }
  
  revalidatePath('/');
}
