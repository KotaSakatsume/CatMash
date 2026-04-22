import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const dbValue = (process.env as any).DB;
  const bucketValue = (process.env as any).BUCKET;
  
  return NextResponse.json({
    message: "Minimal Debug Info",
    hasDB: !!dbValue,
    hasBUCKET: !!bucketValue,
    dbType: typeof dbValue,
    bucketType: typeof bucketValue,
    nextRuntime: (process.env as any).NEXT_RUNTIME || "unknown"
  });
}
