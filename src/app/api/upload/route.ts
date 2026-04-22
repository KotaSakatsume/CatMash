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
    
    // Web Crypto API でハッシュ作成
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 重複チェック
    const db = getDb();
    const checkQuery = db.prepare('SELECT id FROM cats WHERE hash = ?');
    // D1の構文に対応
    const existing = await checkQuery.bind(hash).first();
    
    if (existing) {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 });
    }

    const filename = `${Date.now()}-${hash.substring(0, 8)}.jpg`;
    
    // 本番環境 (Cloudflare R2)
    const bucket = (process.env as any).BUCKET;
    if (!bucket) {
      throw new Error('R2 Binding "BUCKET" is missing.');
    }

    await bucket.put(filename, buffer, {
      httpMetadata: { contentType: 'image/jpeg' }
    });
    
    const imageUrl = `/uploads/${filename}`;

    // DB登録
    await addCat(name, imageUrl, hash);

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
