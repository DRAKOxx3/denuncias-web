-- Add rejectionReason to payments for recording motivos de rechazo
ALTER TABLE "Payment" ADD COLUMN "rejectionReason" TEXT;
