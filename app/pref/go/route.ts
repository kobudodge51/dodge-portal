import { NextResponse } from "next/server";
import { prefByCode } from "@/lib/prefectures";

// トップの「地域から探す」から、選んだ都道府県のページへ移動する
export function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const dest = prefByCode(code) ? `/pref/${code}` : "/associations";
  return NextResponse.redirect(new URL(dest, url.origin));
}
