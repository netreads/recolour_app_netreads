-- migrations/003_add_ip_address.sql
-- Add missing ipAddress and userAgent columns to session table for Better Auth

-- Check if columns exist before adding them
-- Better Auth expects these columns to exist
ALTER TABLE session ADD COLUMN ipAddress TEXT;
ALTER TABLE session ADD COLUMN userAgent TEXT;
