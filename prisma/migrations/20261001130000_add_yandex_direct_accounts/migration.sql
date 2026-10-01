CREATE TABLE "YandexDirectAccount" (
    "id" TEXT NOT NULL,
    "yandexUserId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "displayName" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YandexDirectAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "YandexDirectAccount_yandexUserId_key" ON "YandexDirectAccount"("yandexUserId");
CREATE INDEX "YandexDirectAccount_login_idx" ON "YandexDirectAccount"("login");
