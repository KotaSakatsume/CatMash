CREATE TABLE IF NOT EXISTS cats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  elo INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期データの投入
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('1', 'Luna', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80');
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('2', 'Milo', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&q=80');
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('3', 'Oliver', 'https://images.unsplash.com/photo-1533733503259-bc3d8ab57343?w=800&q=80');
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('4', 'Bella', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80');
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('5', 'Charlie', 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800&q=80');
INSERT OR IGNORE INTO cats (id, name, url) VALUES ('6', 'Simba', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=800&q=80');
