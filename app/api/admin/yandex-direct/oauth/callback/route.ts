import { handleYandexDirectOAuthCallback } from "@/lib/yandexDirectOAuth";

export async function GET(request: Request) {
  return handleYandexDirectOAuthCallback(request);
}
