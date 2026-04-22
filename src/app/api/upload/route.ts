import { NextRequest, NextResponse } from 'next/server';
import { addCat } from '@/app/actions';
import getDb from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return NextResponse.json({ error: 'Missing file or name' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Web Crypto API でハッシュ作成 (Edge対応)
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 重複チェック
    const db = getDb();
    const checkQuery = db.prepare('SELECT id FROM cats WHERE hash = ?');
    const existing = await (checkQuery.first ? checkQuery.bind(hash).first() : Promise.resolve(checkQuery.get(hash)));
    
    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 });
    }

    const filename = `${Date.now()}-${hash.substring(0, 8)}.jpg`;
    let imageUrl = '';

    // --- Cloudflare R2 (本番) か ローカルフォルダ (開発) か ---
    const bucket = (process.env as any).BUCKET;
    
    if (bucket) {
      // 本番環境 (Cloudflare R2)
      await bucket.put(filename, buffer, {
        httpMetadata: { contentType: 'image/jpeg' }
      });
      // バケットの公開設定に合わせたURL
      imageUrl = `/uploads/${filename}`;
    } else if (process.env.NEXT_RUNTIME !== 'edge') {
      // ローカル開発環境 (Node.js環境でのみ実行)
      try {
        const fs = require('fs/promises');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        imageUrl = `/uploads/${filename}`;
      } catch (e) {
        console.error('Local file write error:', e);
      }
    }

    if (!imageUrl) {
      throw new Error('Image could not be saved');
    }

    // DB登録
    await addCat(name, imageUrl, hash);

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
