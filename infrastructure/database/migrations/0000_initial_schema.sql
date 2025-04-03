-- シンプルなテスト用テーブル
CREATE TABLE "test_table" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
); 