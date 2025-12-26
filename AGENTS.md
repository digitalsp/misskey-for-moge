# リポジトリガイドライン

## 開発環境/セットアップ
- 必須: PostgreSQL / Redis / FFmpeg（Meilisearchは任意だが一部機能とテストで必要）
- 初回セットアップ（ローカル実行の場合）:
  - `pnpm install --frozen-lockfile`
  - `pnpm build`
  - `pnpm migrate`
- 開発起動: `pnpm dev`
- パッケージ名は `package.json` の workspaces / 各パッケージの `package.json` の `name` を参照

## テスト/リント
- CI の設定は `.github/workflows` を参照
- ルート: `pnpm lint` / `pnpm test`（全パッケージ）
- フロント/SDK:
  - `pnpm --filter frontend test`
  - `pnpm --filter misskey-js test`
- Backend（事前に `.config/test.yml` 作成 + DB/Redis 起動が必要）:
  - `cp .github/misskey/test.yml .config/`
  - `docker compose -f packages/backend/test/compose.yml up`
  - `pnpm --filter backend test`
  - `pnpm --filter backend test:e2e`
- 変更したコードに対して、テストを追加または更新する

## フロントエンド指針
- Vue 3 + TypeScript
- 新規コンポーネントは Composition API（script setup/ref sugar）を使用

## PR に関する注意事項
- コミットする前に、必ず `pnpm lint` と `pnpm test` を実行してください。
