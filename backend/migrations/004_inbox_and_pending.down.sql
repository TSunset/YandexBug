ALTER TABLE deliveries DROP COLUMN IF EXISTS recipient_user_id;
DROP TABLE IF EXISTS pending_telegram;
DROP TABLE IF EXISTS inbox_messages;
