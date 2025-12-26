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
