CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "display_name" VARCHAR(100) NOT NULL,
  "biography" TEXT,
  "avatar_url" TEXT,
  "birth_date" VARCHAR(10),
  "location" VARCHAR(100),
  "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'ja',
  "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verification_token" TEXT,
  "verification_token_expires_at" TIMESTAMP WITH TIME ZONE,
  "reset_password_token" TEXT,
  "reset_password_token_expires_at" TIMESTAMP WITH TIME ZONE,
  "last_login_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ユーザーロールテーブル
CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL,
  "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "role")
);

-- RLSポリシー設定
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;

-- ユーザーテーブルのポリシー
-- 選択ポリシー: 自分のレコードのみ読み取り可能
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  USING (auth.uid() = id);

-- 挿入ポリシー: 認証されたユーザーのみ自分のレコードを作成可能
CREATE POLICY "users_insert_policy" ON "users"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 更新ポリシー: 自分のレコードのみ更新可能
CREATE POLICY "users_update_policy" ON "users"
  FOR UPDATE
  USING (auth.uid() = id);

-- 削除ポリシー: 自分のレコードのみ削除可能
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  USING (auth.uid() = id);

-- ユーザーロールテーブルのポリシー
-- 選択ポリシー: 自分のロールのみ読み取り可能
CREATE POLICY "user_roles_select_policy" ON "user_roles"
  FOR SELECT
  USING (auth.uid() = user_id);

-- 挿入ポリシー: 管理者のみロールを追加可能
CREATE POLICY "user_roles_insert_policy" ON "user_roles"
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 更新ポリシー: 管理者のみロールを更新可能
CREATE POLICY "user_roles_update_policy" ON "user_roles"
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 削除ポリシー: 管理者のみロールを削除可能
CREATE POLICY "user_roles_delete_policy" ON "user_roles"
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- インデックス作成
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_preferred_language_idx" ON "users"("preferred_language");
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role"); 