-- Прайсы теперь перезаливаются раз в неделю, повторная загрузка одного и того
-- же файла больше не должна блокироваться уникальным индексом.
DROP INDEX "PriceUpload_supplierId_fileHash_key";
CREATE INDEX "PriceUpload_supplierId_fileHash_idx" ON "PriceUpload"("supplierId", "fileHash");
