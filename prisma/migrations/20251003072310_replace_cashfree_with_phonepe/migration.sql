/*
  Warnings:

  - You are about to drop the column `cashfree_order_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `cashfree_order_id` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "cashfree_order_id",
ADD COLUMN     "phonepe_order_id" TEXT;

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "cashfree_order_id",
ADD COLUMN     "phonepe_order_id" TEXT;
