-- DropForeignKey
ALTER TABLE "PendingAccountLink" DROP CONSTRAINT "PendingAccountLink_stateId_fkey";

-- AddForeignKey
ALTER TABLE "PendingAccountLink" ADD CONSTRAINT "PendingAccountLink_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;
