import { startYandexDirectOAuth } from "@/lib/yandexDirectOAuth";

export async function GET(request: Request) {
  return startYandexDirectOAuth(request);
}
