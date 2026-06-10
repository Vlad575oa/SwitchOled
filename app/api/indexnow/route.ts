import { NextRequest, NextResponse } from "next/server";

const KEY = process.env.INDEXNOW_KEY!;
const HOST = (process.env.NEXT_PUBLIC_APP_URL || "https://gameshop24.ru").replace(/\/$/, "");

export async function POST(req: NextRequest) {
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
