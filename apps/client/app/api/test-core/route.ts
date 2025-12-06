import { NextResponse } from "next/server"; 
import { coreReady } from "core";

export async function GET() {
  return NextResponse.json({ ok: true, fromCore: coreReady });
}