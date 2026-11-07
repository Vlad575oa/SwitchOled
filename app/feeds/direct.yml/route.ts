import { buildYmlFeedResponse } from "@/lib/yandexFeed";

export const dynamic = "force-dynamic";

export async function GET() {
  return buildYmlFeedResponse();
}
