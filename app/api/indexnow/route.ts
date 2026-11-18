import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const KEY = process.env.INDEXNOW_KEY!;
const HOST = (process.env.NEXT_PUBLIC_APP_URL || "https://switcholed.ru").replace(/\/$/, "");

function safeEqual(a: string, b: string): boolean {
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  // Internal-only endpoint: callers must present the same INDEXNOW_KEY used
  // to submit to search engines, so it can't be triggered by arbitrary
  // internet traffic to spam-submit unrelated URLs under this site's name.
  const providedKey = req.headers.get("x-indexnow-key");
  if (!KEY || !providedKey || !safeEqual(providedKey, KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { urls } = (await req.json()) as { urls?: string[] };
  if (!urls?.length) return NextResponse.json({ error: "urls required" }, { status: 400 });

  const body = {
    host: HOST.replace("https://", ""),
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const engines = [
    "https://api.indexnow.org/indexnow",
    "https://yandex.com/indexnow",
    "https://www.bing.com/indexnow",
  ];

  const results = await Promise.allSettled(
    engines.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      }).then((r) => ({ engine: url, status: r.status }))
    )
  );

  return NextResponse.json({ submitted: results.map((r) => (r.status === "fulfilled" ? r.value : r.reason)) });
}
