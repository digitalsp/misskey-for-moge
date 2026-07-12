## このリポジトリについて
自分のサーバーで使うために、[本家Misskey](https://github.com/misskey-dev/misskey)をベースに、KaTeXの復活などごく一部を改変したMisskeyバージョンです。基本的に本家に追従しています。

以前flestudioをベースにしていたころの名残として、バージョン名に`-mogestudio-`が付いています。

## 更新と実運用環境への反映

本家Misskeyの最新Stableを安全に取り込み、独自改変を維持したまま検証、GitHub Release公開、実運用サーバーでの`git pull`、Dockerイメージのビルド、DBマイグレーション、再起動、動作確認、切り戻しまで行う詳細な手順は[本家MisskeyのStableへ安全に追従する手順](docs/UPSTREAM_UPDATE.md)を参照してください。
