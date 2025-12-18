import { NextResponse } from "next/server"; 
import { coreReady } from "../../../../../packages/core/src"

export async function GET() {
  return NextResponse.json({ ok: true, fromCore: coreReady });
}