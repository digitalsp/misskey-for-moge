# 本家MisskeyのStableへ安全に追従する手順

この文書は、`digitalsp/misskey-for-moge`で独自改変を維持しながら、本家`misskey-dev/misskey`の最新Stableへ追従するための運用手順です。単に本家のタグをマージするだけではなく、独自差分の把握、競合の意味を確認した解消、自動生成物の同期、ローカル検証、GitHub Actionsの確認、リリース作成、障害時の切り戻しまでを一連の作業として扱います。

## このリポジトリの前提

- `origin`は`https://github.com/digitalsp/misskey-for-moge.git`、`upstream`は`https://github.com/misskey-dev/misskey.git`を指します。
- 公開用の本線は`mogesky`です。本家追従作業は`upgrade/<本家バージョン>`という専用ブランチで行い、検証後に`mogesky`へマージします。
- フォークのリリースバージョンは`<本家バージョン>-mogestudio-v<フォークバージョン>`形式を使用します。例は`2026.6.0-mogestudio-v1.0.4`です。
- フォーク固有の変更履歴は`CHANGELOG_moge.md`へ日本語で記録します。本家の`CHANGELOG.md`は本家から取り込んだ内容を尊重し、フォーク固有の説明を混在させません。
- 通常のフロントエンドと埋め込みフロントエンドに追加したKaTeX数式表示、frontend-embedのlocale inlinerのフォールバック、フォークを示すREADMEとrepository URLは、現在維持すべき主要な独自差分です。作業開始時には必ず実際の差分を再確認し、この一覧だけを信用しないでください。
- PostgreSQL、Redis、FFmpegが必要です。backendテストでは`.config/test.yml`と専用のPostgreSQL、Redis、必要に応じてMeilisearchを使用します。

## 1. 作業開始前の安全確認

最初に現在のブランチ、未コミット変更、追跡先、リモートURLを確認します。

```bash
git status --short --branch
git branch -vv
git remote -v
```

作業ツリーに未コミット変更がある場合、その変更が誰のものか、今回の更新に含めるべきかを確認できるまで追従作業を開始しません。ユーザーの変更をstash、破棄、上書きしてはいけません。`mogesky`が意図した`origin/mogesky`を追跡していることと、`upstream`のfetch URLが本家を指していることも確認します。

GitHubへ公開する可能性がある場合は、GitHub CLIの認証と権限も先に確認します。

```bash
gh --version
gh auth status
```

## 2. 本家の最新情報を取得してStableを決定する

本家のブランチとタグを更新します。

```bash
git fetch upstream --tags --prune
```

最新タグを確認します。

```bash
git tag --sort=-version:refname | head -n 40
```

追従対象は正式リリースだけです。`-alpha.*`、`-beta.*`、`-rc.*`を含むタグはStableとして選びません。Stable候補のタグが本家履歴に含まれること、リリースコミットであること、より新しい正式タグがないことを確認します。

```bash
git show --no-patch --decorate <対象Stableタグ>
git merge-base --is-ancestor <対象Stableタグ> upstream/master
```

GitHub上の本家リリースノートも確認し、必要なNode.js、pnpm、PostgreSQL、Redisのバージョン変更、破壊的変更、必須マイグレーション、廃止機能を把握します。タグ名だけで更新の安全性を判断してはいけません。

## 3. 現在の独自差分を記録する

現在取り込み済みの本家Stableタグを特定し、そのタグと`mogesky`の差分を調べます。ここでは例として`<現在の本家Stable>`を使用します。

```bash
git diff --stat <現在の本家Stable>..mogesky
git diff --name-status <現在の本家Stable>..mogesky
git log --oneline --decorate <現在の本家Stable>..mogesky
```

次に、独自変更ファイルと新しい本家Stableで変更されたファイルの積集合を確認します。積集合に含まれるファイルは、自動マージに成功しても意味上の不整合が起きやすいため重点確認対象です。

```bash
comm -12 <(git diff --name-only <現在の本家Stable>..mogesky | sort) <(git diff --name-only <現在の本家Stable>..<対象Stableタグ> | sort)
```

特に`package.json`、`pnpm-lock.yaml`、`packages/frontend/package.json`、`packages/frontend-embed/package.json`、MFMレンダラー、locale inliner、README、AGENTS.mdは競合や仕様の食い違いが起きやすい箇所です。独自差分の意図を説明できない状態でマージを開始しません。

## 4. 専用アップグレードブランチを作成する

最新の`mogesky`から専用ブランチを作成します。

```bash
git switch mogesky
git pull --ff-only origin mogesky
git switch -c upgrade/<対象Stableタグ>
```

`git pull --ff-only`が失敗した場合、ローカルとリモートの履歴が分岐しています。安易にrebase、reset、force pushを行わず、分岐したコミットを確認して方針を決めます。

## 5. 本家Stableをマージする

本家Stableタグをコミット前の状態でマージします。

```bash
git merge --no-commit --no-ff <対象Stableタグ>
```

競合が発生したら、各ファイルについて`HEAD`側の独自変更、本家タグ側の変更、共通祖先を比較します。競合マーカーを消しただけで解決済みとしてはいけません。基本方針は、本家の新しい構造と依存バージョンを基準にし、その上へ現在も必要な独自機能を再適用することです。

### package.jsonの解消方針

- 本家が更新した依存バージョン、workspace構成、scripts、packageManagerは原則として本家側を採用します。
- ルートの`repository.url`はこのフォークのURLを維持します。
- ルートの`version`はフォーク形式へ更新します。
- KaTeXなど独自機能に必要な依存は、本家側の依存一覧へ追加し直します。
- 本家で削除された依存を、理由なく競合解消で復活させません。

### pnpm-lock.yamlの解消方針

ロックファイルを手作業で部分的に結合すると、古いスナップショットや不要パッケージが残りやすくなります。本家側のロックファイルを基準に競合を解消した後、最終的な全workspaceの`package.json`からpnpmで再生成します。

```bash
pnpm install --lockfile-only
pnpm install --frozen-lockfile
```

pnpmの指定バージョンが変わった場合は、Corepackまたはpnpm自身がリポジトリの`packageManager`を使用していることを確認します。異なるpnpmメジャーバージョンでロックファイルを生成しません。

### AGENTS.mdと開発手順の解消方針

本家の新しい安全規則、スキル参照、検証コマンドを維持し、このフォーク固有のセットアップとテスト方針を補足として統合します。どちらか一方を丸ごと破棄しません。

### 削除されたsubmoduleや生成物の扱い

本家でsubmoduleや生成ファイルが廃止された場合、Git上の削除を採用します。作業ディレクトリにsubmoduleの実体だけが残った場合は、内容を確認し、必要なら一時退避してから削除します。ユーザーが追加した未追跡ファイルと区別できない状態では削除しません。

## 6. 競合解消後に独自機能を重点確認する

競合マーカーが残っていないことを確認します。

```bash
rg -n '^(<<<<<<<|=======|>>>>>>>)' .
git diff --check
git status --short
```

`git diff --check`が本家から取り込んだ既存の末尾空白だけを報告する場合は、その出所を確認して記録します。自分が追加したファイルの空白エラーは修正します。

KaTeXについては、通常フロントエンドと埋め込みフロントエンドの両方で次を確認します。

- `mathInline`がインライン数式コンポーネントを呼び出すこと。
- `mathBlock`がブロック数式コンポーネントを呼び出すこと。
- KaTeX本体と型定義が各workspaceから解決できること。
- CSSが重複して無制限に読み込まれないこと。
- `throwOnError: false`、`trust: false`など、壊れた式や危険な入力に対する既存の安全設定が維持されること。
- frontend-embedのビルドでも動的importとlocale inlinerが両立すること。

## 7. 自動生成物を更新する

本家更新でbackend API、endpoint、meta、paramDef、response型が変わっている場合は、`misskey-js`を必ず再生成します。Stable追従ではAPI変更が含まれる可能性が高いため、原則として毎回実行します。

```bash
pnpm build-misskey-js-with-types
```

実行後は`packages/misskey-js/src/autogen/`、`packages/misskey-js/etc/misskey-js.api.md`などの差分を確認します。生成コマンドを実行した結果が大量に消える、または対象Stableタグと無関係なAPIが消える場合は、backendのビルド設定や`.config`の読み込みを確認します。

## 8. ローカル検証を行う

最低限、依存固定インストール、lint、主要テスト、全体ビルドを実行します。

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm --filter frontend test
pnpm --filter frontend-embed test
pnpm --filter misskey-js test
pnpm build
```

backendテスト用設定とサービスを準備します。

```bash
cp .github/misskey/test.yml .config/test.yml
docker compose -f packages/backend/test/compose.yml up -d
pnpm --filter backend test
pnpm --filter backend test:e2e
```

テスト終了後は、今回起動したテスト用コンテナだけを停止します。

```bash
docker compose -f packages/backend/test/compose.yml down
```

ポート競合、Docker利用不可、PostgreSQLやRedisの未起動など環境要因でbackendテストを実行できない場合は、失敗をコードの不具合と混同せず、接続先、ポート、実行できなかったテスト範囲を記録します。ただし、環境要因を理由にlint、型検査、全体ビルドまで省略してはいけません。

entityまたはmigrationが変更された場合は、テストDBが利用できる状態でマイグレーション検査も行います。

```bash
pnpm --filter backend check-migrations
```

本家ですでに公開されたmigrationファイルは編集しません。修正が必要な場合は新しいmigrationを追加します。

## 9. フォークの変更履歴とバージョンを更新する

`package.json`のバージョンを`<対象Stableタグ>-mogestudio-v<次のフォークバージョン>`へ更新します。`CHANGELOG_moge.md`の先頭へ日本語の項目を追加し、少なくとも次を記録します。

- 取り込んだ本家Stableと、そのリリースノートへのリンク。
- 間に含まれる正式リリースの範囲。
- 維持した独自機能。
- 競合解消や互換性維持のために追加した修正。
- 依存、Node.js、pnpm、DBマイグレーションなど運用に影響する変更。
- 実行した検証と、環境上の理由で未実行になった検証。

リリースノートやコミットメッセージは日本語で具体的に書きます。表示幅を短くする目的の手動折り返しは行わず、閲覧側の自動折り返しに任せます。強調表現は必要最小限にします。

## 10. アップグレードブランチをコミットする

最終差分を確認します。

```bash
git status --short
git diff --stat
git diff <対象Stableタグ> -- package.json CHANGELOG_moge.md packages/frontend/package.json packages/frontend-embed/package.json
```

本家の更新と独自調整を含むマージコミットを作成します。件名だけでなく、取り込んだ範囲、維持した独自機能、互換性修正、検証結果、未検証事項を本文へ記載します。

```bash
git add -A
git commit
```

コミット後、作業ツリーがクリーンで、対象Stableがコミットの祖先であることを確認します。

```bash
git status --short --branch
git merge-base --is-ancestor <対象Stableタグ> HEAD
```

## 11. mogeskyへ統合してpushする

検証済みのアップグレードブランチを`mogesky`へマージします。

```bash
git switch mogesky
git merge --no-ff upgrade/<対象Stableタグ>
```

マージ後のtreeがアップグレードブランチと一致することを確認します。

```bash
git diff --quiet upgrade/<対象Stableタグ> HEAD
```

アップグレードブランチを先にpushし、その後`mogesky`をpushします。

```bash
git push -u origin upgrade/<対象Stableタグ>
git push origin mogesky
```

force pushは行いません。push後、対象コミットで起動したGitHub Actionsを確認します。

```bash
gh run list -R digitalsp/misskey-for-moge --commit <mogeskyのコミットSHA> --limit 30
```

Lint、locale検証、API reportなど、起動したコード検証workflowがすべて成功するまでリリースを作成しません。失敗した場合はworkflow名、run URL、失敗step、ログの根拠を確認し、コードの問題、生成物の不一致、依存問題、外部サービスやsecretの問題を切り分けます。

## 12. タグとGitHub Releaseを作成する

コード検証CIが成功したら、`mogesky`の検証済みコミットへ注釈付きタグを作成します。

```bash
git tag -a <フォークのリリースバージョン> -m "<日本語のリリース名>"
git push origin <フォークのリリースバージョン>
```

タグの指すコミットが`mogesky` HEADと一致することを確認します。

```bash
git rev-list -n 1 <フォークのリリースバージョン>
git rev-parse HEAD
```

GitHub Releaseの本文には、更新の概要、維持した独自機能、主要変更、アップデート手順、バックアップとマイグレーションの注意、検証結果、既知の未検証事項、本家リリースノートへのリンクを含めます。

```bash
gh release create <フォークのリリースバージョン> -R digitalsp/misskey-for-moge --title "<日本語のリリース名>" --notes-file <リリースノートファイル> --latest --verify-tag
```

公開後はReleaseがdraftやprereleaseではなくLatestになっていること、URL、タグ、対象コミットを確認します。

## 13. 本家専用の公開workflowについて

本家から取り込んだ`on-release-created.yml`と`docker.yml`は、npm上の本家`misskey-js`パッケージとDocker Hub上の`misskey/misskey`イメージを公開するためのworkflowです。このフォークには本家公開用の資格情報がなく、本家のパッケージ名やDockerイメージ名へ公開してはいけません。

そのため、これらのjobには`github.repository == 'misskey-dev/misskey'`という条件を設定し、`digitalsp/misskey-for-moge`では安全にskipさせます。このガードは今後の本家追従で競合や上書きにより失われていないか必ず確認します。このフォーク独自のnpmパッケージやDockerイメージを将来公開する場合は、本家用workflowの条件を外すのではなく、フォーク専用のパッケージ名、レジストリ名、secret名、権限、provenance方針を決めた別workflowとして設計します。

## 14. 実運用環境をgit pullとDockerビルドで更新する

ここからは、GitHub Releaseを公開した後、実際に稼働しているMisskeyサーバーを更新する手順です。以下ではリポジトリの`compose_example.yml`を基に作成した運用用Composeファイルを使用し、サービス名が`web`、`db`、`redis`であることを前提にします。実環境でファイル名やサービス名を変更している場合は、コマンドの`<運用Composeファイル>`を実際の値へ置き換えてください。

### 14.1 更新内容とメンテナンス時間を確認する

更新前に、フォークのGitHub Release、本家MisskeyのRelease、`CHANGELOG_moge.md`、本家`CHANGELOG.md`を確認します。新しいmigration、Node.jsやpnpmの変更、PostgreSQLやRedisの必須バージョン、設定項目の追加、削除された機能を把握し、必要な停止時間を見積もります。

Dockerfileの`CMD`は`pnpm run migrateandstart`であり、webコンテナ起動時にmigrationを実行してからMisskeyを起動します。ただし、複数のwebコンテナが同時にmigrationを実行することや、旧コードが動作している最中に新しいスキーマへ変更することを避けるため、この手順ではwebサービスを停止し、1個の一時コンテナで明示的にmigrationを実行してから新しいwebコンテナを起動します。

### 14.2 現在の状態を記録する

サーバーへログインし、リポジトリのディレクトリへ移動して、現在のコミット、ブランチ、コンテナ、イメージ、空き容量を記録します。

```bash
cd <実運用環境のリポジトリパス>
git status --short --branch
git rev-parse HEAD
git describe --tags --always
docker compose -f <運用Composeファイル> ps
docker compose -f <運用Composeファイル> images
docker system df
df -h
```

作業ツリーに差分や未追跡ファイルがある場合は、その所有者と用途を確認します。実運用サーバーで直接編集された設定やコードを、`git pull`で上書きしてはいけません。`.config`、`files`、`db`、`redis`などの永続データは通常Git管理外ですが、誤って追跡されていないことも確認します。

### 14.3 バックアップを取得する

少なくともPostgreSQL、`.config`、ローカルファイルストレージをバックアップします。Redisは再生成可能なキャッシュだけを保持する構成もありますが、ジョブキューや重要な一時状態を含む可能性があるため、運用方針に応じて永続データも保護します。外部S3互換ストレージを使用している場合は、そのバケットのバージョニングまたはスナップショットも確認します。

PostgreSQLの例です。ユーザー名とDB名は`.config/docker.env`および実環境の設定に合わせます。バックアップファイルはリポジトリ外のアクセス制限されたディレクトリへ保存してください。

```bash
mkdir -p <安全なバックアップ先>/<更新日時>
docker compose -f <運用Composeファイル> exec -T db pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -Fc > <安全なバックアップ先>/<更新日時>/misskey.dump
docker compose -f <運用Composeファイル> exec -T db pg_dumpall -U <POSTGRES_USER> --globals-only > <安全なバックアップ先>/<更新日時>/postgres-globals.sql
```

設定とローカルファイルストレージの例です。容量が大きい場合は、スナップショット、増分バックアップ、rsyncなど実環境の方式を使用します。

```bash
tar -C <実運用環境のリポジトリパス> -cpf <安全なバックアップ先>/<更新日時>/config.tar .config
tar -C <実運用環境のリポジトリパス> -cpf <安全なバックアップ先>/<更新日時>/files.tar files
```

バックアップコマンドが終了コード0で完了したこと、ファイルサイズが0ではないこと、可能であれば別環境で復元できることを確認します。バックアップを取得しただけで復元可能とは判断しません。

### 14.4 データベースイメージのメジャーバージョンを確認する

`compose_example.yml`は新規構築向けの例であり、現在はPostgreSQL 18を指定しています。既存環境がPostgreSQL 15、16、17などで稼働している場合、既存のデータディレクトリをそのままPostgreSQL 18コンテナへ接続してはいけません。PostgreSQLのメジャーアップグレードには`pg_upgrade`またはdump／restoreが必要です。

```bash
docker compose -f <運用Composeファイル> exec -T db postgres --version
docker compose -f <運用Composeファイル> config | sed -n '/db:/,/^[^ ]/p'
```

今回のMisskey更新とPostgreSQLメジャーアップグレードを同時に行う必要がない場合は、運用用ComposeファイルのDBイメージを現在のメジャーバージョンに固定したままにします。DBメジャーアップグレードは、Misskey更新とは分離した作業計画、復元試験、十分な停止時間を用意して実施します。

### 14.5 GitHubから更新を取得する

リモートとタグを取得し、公開されたリリースタグが存在することを確認します。

```bash
git fetch origin --tags --prune
git tag --list '<対象のフォークリリースバージョン>'
git show --no-patch --decorate <対象のフォークリリースバージョン>
```

`mogesky`を運用ブランチとしている場合は、ローカル変更がないことを再確認してからfast-forward限定でpullします。

```bash
git switch mogesky
git status --short --branch
git pull --ff-only origin mogesky
```

意図しない将来のコミットまで`mogesky`へ入っている可能性を排除し、公開リリースと完全に同じコードを配備したい場合は、リリースタグを直接checkoutします。この場合はdetached HEADになるため、運用記録にその旨を残します。

```bash
git switch --detach <対象のフォークリリースバージョン>
```

pullまたはcheckout後、現在のコミットとリリースタグが指すコミットを比較します。

```bash
git rev-parse HEAD
git rev-list -n 1 <対象のフォークリリースバージョン>
git status --short --branch
```

2つのSHAが一致しない場合、意図したリリースを配備しようとしているか再確認し、理由を説明できるまでビルドを開始しません。

### 14.6 Compose設定を事前検証する

設定ファイル、環境変数、volume、networkの組み合わせをDocker Composeに検証させます。

```bash
docker compose -f <運用Composeファイル> config --quiet
docker compose -f <運用Composeファイル> config --services
```

`.config/default.yml`または実運用で使用する設定ファイルについて、DB、Redis、Meilisearch、オブジェクトストレージ、URL、port、proxy設定が現在の環境と一致することを確認します。リリースで新しい設定項目が追加された場合は、本家の`.config/example.yml`との差分を見て必要な値だけを実運用設定へ追加します。本番のsecretをGitへ追加しません。

### 14.7 現在のwebイメージを切り戻し用に保持する

新しいビルドで既存のローカルタグが置き換わる前に、現在のwebイメージIDを確認し、切り戻し用タグを付けます。

```bash
docker compose -f <運用Composeファイル> images web
OLD_IMAGE_ID=$(docker compose -f <運用Composeファイル> images -q web)
test -n "$OLD_IMAGE_ID"
docker image tag "$OLD_IMAGE_ID" misskey-for-moge:rollback-<更新前バージョン>
```

Composeファイルの`web`に明示的な`image:`がなく`build: .`だけがある場合、Composeはプロジェクト名に基づくローカルイメージ名を使用します。上記のようにイメージIDから別タグを作れば、Composeの命名に依存せず旧イメージを保持できます。

### 14.8 新しいDockerイメージをビルドする

DBとRedisを停止せず、まずwebイメージだけをビルドします。`--pull`によりDockerfileで指定されたNode.jsベースイメージの新しい同一タグを確認します。

```bash
docker compose -f <運用Composeファイル> build --pull web
```

キャッシュ破損や依存の取り違えが疑われる場合に限り、十分な時間とディスク容量を確保してキャッシュなしで再ビルドします。

```bash
docker compose -f <運用Composeファイル> build --pull --no-cache web
```

ビルド中は、pnpmの固定インストール、backend、frontend、frontend-embed、i18n、service worker、静的アセットのビルドが成功したことをログで確認します。警告とエラーを区別し、終了コード0だけでなく、KaTeXやlocale inlinerを含むフロントエンドビルドが実行されたことを確認します。

ビルド後、新しいイメージが作成され、異常に古い作成日時や意図しないアーキテクチャになっていないことを確認します。

```bash
docker compose -f <運用Composeファイル> images web
docker image inspect $(docker compose -f <運用Composeファイル> images -q web) --format '{{.Id}} {{.Created}} {{.Architecture}}'
```

### 14.9 webを停止してmigrationを実行する

利用者へメンテナンス開始を案内し、webサービスだけを停止します。DBとRedisは稼働させたままにします。

```bash
docker compose -f <運用Composeファイル> stop web
docker compose -f <運用Composeファイル> ps
```

新しいwebイメージから一時コンテナを1個だけ起動し、migrationを実行します。`--no-deps`はDBやRedisを新しく作り直さないための指定であり、既に稼働しているCompose network上のDBへは接続できます。

```bash
docker compose -f <運用Composeファイル> run --rm --no-deps web pnpm migrate
```

migrationの終了コードが0であることを確認します。失敗した場合は新しいwebを起動せず、ログ、DB接続、適用済みmigration、バックアップの状態を確認します。同じmigrationを原因不明のまま繰り返し実行しません。

### 14.10 新しいwebコンテナを起動する

migration成功後、新しいイメージでwebコンテナを再作成します。

```bash
docker compose -f <運用Composeファイル> up -d --no-deps --force-recreate web
docker compose -f <運用Composeファイル> ps
```

Dockerfileの起動コマンドによりmigration確認がもう一度実行されますが、適用済みmigrationは再適用されず、その後Misskeyが起動します。health checkがhealthyになるまでログを確認します。

```bash
docker compose -f <運用Composeファイル> logs --tail=200 -f web
```

ログ追跡を終了した後、コンテナ状態とhealth checkを確認します。

```bash
docker compose -f <運用Composeファイル> ps
docker inspect --format '{{json .State.Health}}' $(docker compose -f <運用Composeファイル> ps -q web)
```

### 14.11 実運用の動作確認を行う

外部の監視経路とブラウザの両方から確認します。localhostだけで成功しても、reverse proxy、TLS、CDN、ロードバランサーを経由した実際のアクセスが壊れている可能性があります。

- トップページとhealth checkが正常なHTTPステータスを返すこと。
- ログイン済み画面でホーム、ローカル、グローバルなど利用中のタイムラインを取得できること。
- テスト投稿、リアクション、通知、検索、ファイルアップロードとダウンロードが動作すること。
- インライン数式とブロック数式が通常のノート画面で正しく表示されること。
- 公開ノートの埋め込み表示でも数式が正しく表示されること。
- 外部インスタンスとの投稿送信と受信が継続していること。
- ジョブキューが停止しておらず、失敗ジョブが急増していないこと。
- PostgreSQL、Redis、Meilisearch、オブジェクトストレージへの接続エラーが繰り返されていないこと。
- CPU、メモリ、ディスク、DB接続数、Redisメモリ、キュー滞留が更新前と比べて異常に増えていないこと。

更新直後だけでなく、少なくとも数十分はログと監視を継続します。

```bash
docker compose -f <運用Composeファイル> logs --since=30m web
docker stats --no-stream
```

### 14.12 Docker環境で問題が発生した場合の切り戻し

migrationがまだ実行されていない段階で新しいイメージの起動だけに問題がある場合は、webサービスを停止し、運用Composeファイルの`image:`を退避した`misskey-for-moge:rollback-<更新前バージョン>`へ一時的に変更するか、旧イメージをComposeが使用する元のタグへ戻してwebを再作成します。

```bash
docker compose -f <運用Composeファイル> stop web
docker image tag misskey-for-moge:rollback-<更新前バージョン> <Composeがwebに使用するイメージ名>
docker compose -f <運用Composeファイル> up -d --no-deps --force-recreate web
```

migration実行後は、旧コードが新しいスキーマと互換とは限りません。コードやイメージだけを先に戻してはいけません。新しいmigrationの`down`が安全に実行できるかをコードと本家の注意事項で確認し、安全性を証明できない場合は、メンテナンスを継続してDBを更新前バックアップから復元し、コード、DB、設定、ローカルファイルを同じ更新前時点へ揃えます。

切り戻し後も、health check、ログイン、タイムライン、投稿、ファイル、federation、キューを再確認します。障害原因と切り戻した範囲を記録し、修正版は既存タグを書き換えず新しいパッチバージョンとして公開します。

### 14.13 更新成功後の整理

十分な監視期間を経て問題がないことを確認してから、不要になったビルドキャッシュや古いイメージを整理します。削除前に、切り戻し用イメージとバックアップの保持期間を運用ポリシーに従って確認します。

```bash
docker image ls
docker builder prune
```

`docker system prune -a`は停止中のイメージやキャッシュを広範囲に削除するため、他サービスとDockerホストを共有している環境では使用しません。DB、Redis、filesのvolumeやbind mountを削除するコマンドは実行しません。

## 15. リリース後の確認

リリース公開で追加workflowが起動した場合は、その結果も確認します。コード検証workflowが成功し、本家専用公開jobがフォーク上でskipされていることを確認します。

```bash
gh run list -R digitalsp/misskey-for-moge --commit <リリースコミットSHA> --limit 30
```

デプロイ環境では、次を確認します。

- `pnpm migrate`が成功したこと。
- Misskeyプロセスが正常に起動し、health checkが成功すること。
- Webクライアントを開けること。
- ログイン、タイムライン取得、投稿、リアクション、ファイルアップロードが動作すること。
- インライン数式とブロック数式が通常画面と埋め込み画面で表示されること。
- federationの送受信、ジョブキュー、Redis、PostgreSQLに継続的なエラーがないこと。
- 管理画面に新しいマイグレーションやAPI型の不整合を示すエラーがないこと。

## 16. 問題が見つかった場合の切り戻し

公開済みタグや共有済みコミットをamend、reset、force pushで書き換えません。問題の修正は原則として新しいコミットとパッチリリースで行います。

デプロイを切り戻す前に、今回のマイグレーションがdown可能か、旧コードが新しいDBスキーマを読めるかを確認します。DBマイグレーション後にコードだけを旧版へ戻すと、旧コードと新スキーマが不整合になる可能性があります。安全性を確認できない場合は、事前バックアップからDBとコードを同じ時点へ復元します。

GitHub Releaseの説明に重大な誤りがある場合は本文を修正できますが、公開済みバイナリやタグの内容が変わる修正を説明文だけで済ませません。コード変更が必要なら新しいフォークバージョンを発行し、どのリリースを置き換えるものか明記します。

## 最終チェックリスト

- [ ] 作業開始時の`mogesky`がクリーンで、ユーザーの未コミット変更がない。
- [ ] `upstream`をfetchし、alpha、beta、rcではない最新Stableを選んだ。
- [ ] 旧Stableと`mogesky`の独自差分を記録した。
- [ ] 独自変更と本家変更が重なるファイルを重点確認した。
- [ ] `upgrade/<対象Stableタグ>`ブランチで本家タグをマージした。
- [ ] 競合を本家の新構成を基準に意味を確認して解消した。
- [ ] KaTeX、埋め込み表示、locale inliner、repository表記を確認した。
- [ ] 本家専用npm／Docker公開jobのrepositoryガードを確認した。
- [ ] pnpmロックファイルを指定pnpmバージョンで再生成した。
- [ ] `pnpm build-misskey-js-with-types`を実行した。
- [ ] `pnpm lint`、主要テスト、`pnpm build`を実行した。
- [ ] backendテストとmigration検査を実行したか、実行不能な環境要因を記録した。
- [ ] `package.json`と`CHANGELOG_moge.md`を日本語で更新した。
- [ ] アップグレードブランチと`mogesky`のtreeが一致することを確認した。
- [ ] push後のコード検証CIがすべて成功した。
- [ ] 注釈付きタグが検証済み`mogesky`コミットを指している。
- [ ] 日本語の詳細なGitHub Releaseを公開し、Latest、タグ、対象コミットを確認した。
- [ ] リリース後workflowとデプロイ後の基本機能を確認した。
- [ ] 実運用環境で更新前コミット、コンテナ、イメージ、空き容量を記録した。
- [ ] PostgreSQL、設定、files、必要な外部ストレージの復元可能なバックアップを取得した。
- [ ] PostgreSQLイメージのメジャーバージョンを意図せず変更していない。
- [ ] `git pull --ff-only`またはリリースタグcheckout後のSHAが公開タグと一致した。
- [ ] `docker compose config --quiet`が成功した。
- [ ] 旧webイメージへ切り戻せるタグを保持した。
- [ ] `docker compose build --pull web`が成功した。
- [ ] webだけを停止し、1個の一時コンテナでmigrationが成功した。
- [ ] 新しいwebコンテナがhealthyになり、実際の公開経路から基本機能とKaTeX表示を確認した。
- [ ] 更新後のログ、リソース、DB、Redis、キュー、federationを継続監視した。
