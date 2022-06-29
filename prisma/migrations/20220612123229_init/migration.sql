-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "en" TEXT NOT NULL,
    "pl" TEXT NOT NULL,
    "audio" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_en_key" ON "Word"("en");
