-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."transactions" ALTER COLUMN "user_id" DROP NOT NULL;
