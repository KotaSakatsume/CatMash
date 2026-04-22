import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { addCat } from '@/app/actions';
import getDb from '@/lib/db';

export const runtime = 'nodejs'; // ローカル用のライブラリ（fs系）を使うため

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
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 重複チェック
    const db = getDb();
    const checkQuery = db.prepare('SELECT id FROM cats WHERE hash = ?');
    const existing = await (checkQuery.first ? checkQuery.bind(hash).first() : Promise.resolve(checkQuery.get(hash)));
    
    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 });
    }

    const filename = `${Date.now()}-${hash.substring(0, 8)}.jpg`;
    let imageUrl = '';

    // --- R2 (Cloudflare) か ローカルフォルダ (fs) か ---
    const bucket = (process.env as any).BUCKET;
    
    if (bucket) {
      // 本番環境 (Cloudflare R2)
      await bucket.put(filename, buffer, {
        httpMetadata: { contentType: 'image/jpeg' }
      });
      // R2の公開URL (デプロイ後に設定するURLを想定)
      imageUrl = `/uploads/${filename}`; // PagesのR2バインドを使う場合のパス
    } else {
      // ローカル開発環境
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    // DB登録
    await addCat(name, imageUrl, hash);

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
