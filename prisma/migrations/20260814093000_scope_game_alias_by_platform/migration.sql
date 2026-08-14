-- GameAlias.normalized был уникален глобально, из-за чего одинаковое название игры на
-- разных платформах (PS4/PS5/SWITCH/...) делило один alias — строка прайса с другой
-- платформы могла сопоставиться не с той игрой при точном совпадении названия.
-- Теперь alias уникален в пределах платформы (денормализованной из связанной Game).

ALTER TABLE "GameAlias" ADD COLUMN "platform" TEXT;

UPDATE "GameAlias" a
SET "platform" = g."platform"
FROM "Game" g
WHERE g.id = a."gameId";

ALTER TABLE "GameAlias" ALTER COLUMN "platform" SET NOT NULL;

DROP INDEX "GameAlias_normalized_key";
CREATE UNIQUE INDEX "GameAlias_normalized_platform_key" ON "GameAlias"("normalized", "platform");
