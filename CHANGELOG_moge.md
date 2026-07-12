## 2026.6.0-mogestudio-v1.0.4

### General

- ベースバージョンをMisskey 2026.6.0へ更新
  - [本家Misskey 2026.6.0の更新情報](https://github.com/misskey-dev/misskey/releases/tag/2026.6.0)
  - 2026.5.2、2026.5.3、2026.5.4および2026.6.0までの正式リリースに含まれる変更を取り込み
- UIおよびAPIで表示されるフォークのバージョンを`2026.6.0-mogestudio-v1.0.4`へ更新
- 本家の依存関係更新に追従し、パッケージマネージャーをpnpm 11.5.2へ更新
- 本家で廃止された`fluent-emojis` submoduleを削除し、`@misskey-dev/emoji-assets`を利用する新しい構成へ移行
- 本家で追加されたAIエージェント向け開発ガイドと検証手順を取り込み、このフォーク固有のセットアップおよびテスト方針を併記
- 本家のAPI変更に合わせて`misskey-js`の型定義と自動生成コードを再生成
- 本家Stableの調査と取り込みから、実運用環境でのバックアップ、`git pull`、Dockerビルド、migration、再起動、動作確認、切り戻しまでを説明する詳細な日本語運用手順書を追加
- 本家専用のmisskey-jsおよびDocker Hub公開workflowがこのフォークで誤作動しないよう、`misskey-dev/misskey`でのみ公開jobを実行する安全条件を追加

### Client

- 独自改変のKaTeXによる数式表示を通常のフロントエンドと埋め込み表示の両方で維持
- KaTeXの型定義を追加し、Misskey 2026.6.0のTypeScriptおよびVueの更新後も型検査と本番ビルドが通るように調整
- 埋め込みフロントエンドのlocale inlinerについて、i18n識別子を直接参照するチャンクではビルドを中断せず、従来どおり実行時参照へフォールバックする独自挙動を維持
- 本家2026.6.0に含まれていたfrontend-builderとfrontend-embedの型不整合を修正し、ルートの`pnpm lint`が成功する状態に調整

### 検証

- `pnpm install --frozen-lockfile`、`pnpm build-misskey-js-with-types`、`pnpm lint`、`pnpm build`が成功することを確認
- frontendの163テスト、misskey-jsの14テストおよび型定義テストが成功することを確認

## 2026.5.1-mogestudio-v1.0.3
### General
- ベースバージョンを2026.5.1に更新
	- [本家の更新情報](https://github.com/misskey-dev/misskey/releases/tag/2026.5.1)
- package.jsonを変更し、UI上のバージョンが2026.5.1-mogestudio-v1.0.3となるように
- fork固有のREADME.mdとfrontend-embedのlocale inliner調整を維持
- 依存関係とlockfileは本家2026.5.1を基準に更新

## 2025.12.2-mogestudio-v1.0.2
### General
- ベースバージョンを2025.12.2に
	- [本家の更新情報](https://github.com/misskey-dev/misskey/releases/tag/2025.12.2)
- package.jsonを変更し、UI上のバージョンが2025.12.2-mogestudio-v1.0.2となるように
- 今後のAI開発のためにAGENTS.mdを追加（暫定版）
- README.mdを更新し、本家と大きく異なるものに
- mogestudioのCHANGELOG.mdであるCHANGELOG_moge.mdを追加

## 2025.12.0-mogestudio-v1.0.1

### General
- 本家 2025.12.0にKaTeX復活と、その後のエラー解決のCommitなど3件を含む
- frontend-embed の locale inliner が i18n 識別子直接参照をエラーにしていたため警告扱いに変更（インラインはスキップしランタイム参照で継続）
- <option> 配下の`<i>/<span>`をテキスト化し、HTML 仕様違反警告を解消
- 一応13.6.1-flestudio-v1.1.3から直で上げてもいいはずだが、注意するように

## 13.9.1-mogestudio-v1.0.0

### Improvements
- DM（チャット）機能の維持（[Revert drop messaging](https://github.com/digitalsp/misskey-for-moge/commit/10b5ce31d75842645f0874771415063e3b0e8255) , [起動しないバグの修正](https://github.com/digitalsp/misskey-for-moge/commit/4f8130e777e937c04b6e04616c476bf640e1ad04) ）
- グループ機能の維持（ [Revert drop group](https://github.com/digitalsp/misskey-for-moge/commit/b3374250c974b8b2dbce145863d2d36ee29f5df2) ,）
- KaTeX機能の維持（flestudio時代から、未リリースだった）
- メディアタイムラインの追加（flestudio時代から、未リリースだった）
- その他[misskey-dev/misskey](https://github.com/misskey-dev/misskey)への13.9.1までの変更の取り込み
  - 意図していませんが一部の13.9.1までの変更のうち適用されていないものがあります

### Bugfixes
- Improvementsに伴う不具合の解消（ [fnmを導入してNode.js v18に](https://github.com/digitalsp/misskey-for-moge/commit/703226e87fd619cb1d8a55f300ecffa0b80e6813) , [投稿フォームが表示できないバグ](https://github.com/digitalsp/misskey-for-moge/commit/3ed942d4f691648349e0b3e52528747b5bd66b42) , [フォローボタン左のボタンが押せないバグ](https://github.com/digitalsp/misskey-for-moge/commit/e63a266a1b9a5af3f73a13e046d908d856eb9f1f) ）
- chore: pnpmを8.14.3に更新（Node.js v20への更新の布石）（[pnpmのアップデート](https://github.com/digitalsp/misskey-for-moge/commit/4c9bddce782b7b7272b6e4e1cc48a8cf7690a847)）
- chore: summalyをv5.0.3に更新し、取得先をnpmに変更
