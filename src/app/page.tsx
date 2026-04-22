'use client';

export const runtime = 'edge';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Upload, X, Camera, CheckCircle2, Languages } from 'lucide-react';
import { getRandomMatchup, vote, Cat } from './actions';
import './home.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1514888214013-1f1488286974?w=800&q=80';

// 翻訳データ
const i18n = {
  en: {
    subtitle: "Were we let in for our looks? No. Will we be judged on them? Yes.",
    leaderboard: "Leaderboard",
    uploadBtn: "Upload Cat",
    addCatTitle: "Add a New Cat",
    catNamePlaceholder: "Cat's Name",
    selectPhoto: "Select a photo",
    uploading: "Uploading...",
    uploadStart: "Upload & Start Mash",
    successTitle: "Purr-fect!",
    successMsg: "Added to the competition.",
    voteHeader: "Vote",
    loading: "Loading...",
  },
  ja: {
    subtitle: "かわいい猫はどっち？",
    leaderboard: "ランキング",
    uploadBtn: "猫を追加する",
    addCatTitle: "新しい猫を追加",
    catNamePlaceholder: "猫の名前",
    selectPhoto: "写真を選択",
    uploading: "アップロード中...",
    uploadStart: "猫を追加する",
    successTitle: "完了！",
    successMsg: "エントリーが完了しました。",
    voteHeader: "投票",
    loading: "読み込み中...",
  }
};

export default function Home() {
  const [lang, setLang] = useState<'en' | 'ja'>('ja');
  const t = i18n[lang];

  const [matchup, setMatchup] = useState<[Cat, Cat] | null>(null);
  const [voting, setVoting] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 言語設定を復元
    const savedLang = localStorage.getItem('catmash_lang') as 'en' | 'ja';
    if (savedLang) setLang(savedLang);

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const savedMatchup = localStorage.getItem('catmash_current_matchup');
    if (savedMatchup) {
      setMatchup(JSON.parse(savedMatchup));
    } else {
      fetchNewMatchup();
    }
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ja' : 'en';
    setLang(newLang);
    localStorage.setItem('catmash_lang', newLang);
  };

  const fetchNewMatchup = async () => {
    const newPair = await getRandomMatchup();
    setMatchup(newPair);
    localStorage.setItem('catmash_current_matchup', JSON.stringify(newPair));
    setWinnerId(null);
    setLoaded({});
  };

  const handleVote = async (winnerId: string) => {
    if (voting || !matchup) return;
    setVoting(true);
    setWinnerId(winnerId);
    const loserId = matchup[0].id === winnerId ? matchup[1].id : matchup[0].id;
    await vote(winnerId, loserId);
    setTimeout(async () => {
      await fetchNewMatchup();
      setVoting(false);
    }, 800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      };
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || uploading) return;
    setUploading(true); setUploadError(null);
    try {
      const resizedBlob = await resizeImage(uploadFile);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'cat.jpg');
      formData.append('name', uploadName);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadSuccess(true);
        setTimeout(() => {
          setIsUploadOpen(false); setUploadSuccess(false); setUploadName(''); setUploadFile(null); setUploadPreview(null);
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({ error: `Server Error (${res.status})` }));
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) { setUploadError('Network error'); } finally { setUploading(false); }
  };

  const handleImageLoad = (id: string) => setLoaded(prev => ({ ...prev, [id]: true }));
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget; if (target.getAttribute('data-errored')) return;
    target.setAttribute('data-errored', 'true'); target.src = FALLBACK_IMAGE;
  };

  if (!matchup) return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="pulse" style={{ width: 100, height: 100, borderRadius: '50%' }} /></div>;

  return (
    <div className="container">
      <header className="header animate-fade-in">
        <div className="topActions">
          <button className="langToggle glass" onClick={toggleLang}>
            <Languages size={14} />
            {lang === 'ja' ? '日本語' : 'English'}
          </button>
        </div>
        <h1 className="title">CATMASH</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>

      <main className="matchup">
        {/* TOP / LEFT CAT */}
        <div className="cardWrapper">
          <AnimatePresence mode="wait">
            {(!winnerId || winnerId === matchup[0].id) && (
              <motion.div
                key={matchup[0].id}
                initial={{ opacity: 0, scale: 0.9, x: isMobile ? 0 : -20, y: isMobile ? -20 : 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: winnerId === matchup[0].id ? 1.05 : 1, 
                  x: !isMobile && winnerId === matchup[0].id ? '50%' : 0,
                  y: isMobile && winnerId === matchup[0].id ? '50%' : 0,
                  zIndex: winnerId === matchup[0].id ? 20 : 1
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`card cardLeft glass ${winnerId === matchup[0].id ? 'winner' : ''}`}
                onClick={() => handleVote(matchup[0].id)}
              >
                {!loaded[matchup[0].id] && <div className="pulse" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />}
                <img src={matchup[0].url} alt={matchup[0].name} className="catImage" onLoad={() => handleImageLoad(matchup[0].id)} onError={handleImageError} />
                <div className="cardOverlay"><span className="catName">{matchup[0].name}</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!winnerId && <motion.div className="divider" exit={{ opacity: 0, scale: 0 }}><div className="orCircle">OR</div></motion.div>}
        </AnimatePresence>

        {/* BOTTOM / RIGHT CAT */}
        <div className="cardWrapper">
          <AnimatePresence mode="wait">
            {(!winnerId || winnerId === matchup[1].id) && (
              <motion.div
                key={matchup[1].id}
                initial={{ opacity: 0, scale: 0.9, x: isMobile ? 0 : 20, y: isMobile ? 20 : 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: winnerId === matchup[1].id ? 1.05 : 1, 
                  x: !isMobile && winnerId === matchup[1].id ? '-50%' : 0,
                  y: isMobile && winnerId === matchup[1].id ? '-50%' : 0,
                  zIndex: winnerId === matchup[1].id ? 20 : 1
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`card cardRight glass ${winnerId === matchup[1].id ? 'winner' : ''}`}
                onClick={() => handleVote(matchup[1].id)}
              >
                {!loaded[matchup[1].id] && <div className="pulse" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />}
                <img src={matchup[1].url} alt={matchup[1].name} className="catImage" onLoad={() => handleImageLoad(matchup[1].id)} onError={handleImageError} />
                <div className="cardOverlay"><span className="catName">{matchup[1].name}</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="footer animate-fade-in">
        <Link href="/leaderboard">
          <button className="rankingButton"><Trophy size={16} /> {t.leaderboard}</button>
        </Link>
      </footer>

      <div className="secondaryButtons">
        <button className="iconButton glass" onClick={() => setIsUploadOpen(true)}>
          <Upload size={20} />
          <span>{t.uploadBtn}</span>
        </button>
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modalOverlay">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modalContent glass">
              <button className="closeButton" onClick={() => setIsUploadOpen(false)}><X size={24} /></button>
              {uploadSuccess ? (
                <div className="uploadSuccess">
                  <CheckCircle2 size={64} color="#4ade80" />
                  <h2>{t.successTitle}</h2>
                  <p>{t.successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleUpload}>
                  <h2 className="modalTitle">{t.addCatTitle}</h2>
                  <div className="uploadArea" onClick={() => fileInputRef.current?.click()}>
                    {uploadPreview ? <img src={uploadPreview} alt="Preview" className="uploadPreview" /> : (
                      <div className="uploadPlaceholder"><Camera size={48} opacity={0.3} /><p>{t.selectPhoto}</p></div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} required />
                  </div>
                  {uploadError && <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{uploadError}</p>}
                  <input 
                    type="text" placeholder={t.catNamePlaceholder} className="nameInput"
                    value={uploadName} onChange={(e) => setUploadName(e.target.value)} required 
                  />
                  <button type="submit" className="submitButton" disabled={uploading}>
                    {uploading ? t.uploading : t.uploadStart}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
