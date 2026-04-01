-- CreateTable
CREATE TABLE "vacancies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "salary" TEXT,
    "location" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vacancies_published_deletedAt_idx" ON "vacancies"("published", "deletedAt");

-- CreateIndex
CREATE INDEX "vacancies_position_idx" ON "vacancies"("position");
