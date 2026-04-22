'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { getLeaderboard, Cat } from '../actions';
import './leaderboard.css';

const i18n = {
  en: {
    title: "Leaderboard",
    back: "Vote",
    wins: "wins",
    pts: "pts",
    loading: "Loading rankings...",
    info: "Ranking is based on Elo Rating System",
  },
  ja: {
    title: "ランキング",
    back: "投票に戻る",
    wins: "勝",
    pts: "点",
    loading: "ランキング読み込み中...",
    info: "順位はEloレーティングシステムに基づいて計算されています",
  }
};

export default function Leaderboard() {
  const [lang, setLang] = useState<'en' | 'ja'>('ja');
  const t = i18n[lang];

  const [ranking, setRanking] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 言語設定を復元
    const savedLang = localStorage.getItem('catmash_lang') as 'en' | 'ja';
    if (savedLang) setLang(savedLang);

    async function fetchLeaderboard() {
      const data = await getLeaderboard();
      setRanking(data);
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="rankContainer">
      <header className="rankHeader">
        <Link href="/">
          <button className="backButton">
            <ArrowLeft size={18} />
            {t.back}
          </button>
        </Link>
        <h1 className="rankTitle">{t.title}</h1>
        <div style={{ width: 80 }} />
      </header>

      <main className="rankList">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>{t.loading}</div>
        ) : ranking.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rankItem glass"
          >
            <div className="rankNumber">
              {index === 0 ? <Crown size={24} color="#ffd700" /> : `#${index + 1}`}
            </div>
            <img src={cat.url} alt={cat.name} className="rankImage" />
            <div className="rankInfo">
              <span className="rankName">{cat.name}</span>
              <span className="rankStats">{cat.wins} {t.wins} • {cat.elo} {t.pts}</span>
            </div>
            <div className="rankScore">
              {cat.elo}
            </div>
          </motion.div>
        ))}
      </main>

      <footer style={{ marginTop: '4rem', paddingBottom: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <Trophy size={16} style={{ marginBottom: 8 }} />
        <p>{t.info}</p>
      </footer>
    </div>
  );
}
