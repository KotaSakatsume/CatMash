import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const envKeys = Object.keys(process.env);
  const hasDB = !!(process.env as any).DB;
  const hasBUCKET = !!(process.env as any).BUCKET;
  
  return NextResponse.json({
    message: "Debug Info",
    runtime: "edge",
    envKeys: envKeys.filter(k => !k.includes('KEY') && !k.includes('SECRET')), // セキュリティのため一部秘匿
    hasDB,
    hasBUCKET,
    nodeVersion: process.version,
    nextRuntime: process.env.NEXT_RUNTIME
  });
}
