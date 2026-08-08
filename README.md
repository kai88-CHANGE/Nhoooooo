# N高ポータル（学内ポータルサイト）

> Google Workspace（`@nnn.ed.jp`）アカウント専用の学内ポータル。Yahoo! Japan ライクなデザインで校内ニュース・生徒投稿・コイン決済などを一元管理できます。

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## スクリーンショット

| ログイン画面 | ポータル本体 | 機関誌エディタ |
|---|---|---|
| Google認証（`@nnn.ed.jp`のみ） | ニュース・ウォレット・検索 | セクションベースの記事作成 |

---

## 主な機能

- **Google OAuth ログイン** — 指定ドメイン（`@nnn.ed.jp`）以外は拒否
- **校内トピックス** — カテゴリタブ切り替え・全文検索・トップ固定（コイン消費）
- **生徒投稿 / 機関誌エディタ** — 見出し / 本文 / 画像 / 引用 を自由に組み合わせた記事を作成・閲覧
- **114514 コインウォレット** — チャージ・決済・履歴
- **イベント申込 / ショップ購入** — コイン払いで購入可
- **レスポンシブデザイン** — スマホ対応済み

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/<username>/nhigh-portal.git
cd nhigh-portal
```

### 2. Google Cloud で Client ID を取得

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアントID」を作成
3. アプリケーションの種類：**ウェブアプリケーション**
4. 「承認済みの JavaScript 生成元」にサイトの URL を追加（ローカル開発なら `http://localhost:8080`）

### 3. Client ID を設定

`index.html` をテキストエディタで開き、以下の行を書き換える：

```javascript
var GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE";  // ← ここに貼り付ける
var SCHOOL_DOMAIN    = "nnn.ed.jp";            // ← ドメインを変更する場合はここを書き換える
```

### 4. ブラウザで開く

```bash
# Python の場合（ローカルサーバー起動）
python3 -m http.server 8080

# その他の方法
npx serve .
```

ブラウザで `http://localhost:8080` にアクセスして完了。

> **注意：** Google OAuth は `http://localhost` または `https://` 環境でのみ動作します。ダブルクリックで直接開いた場合はログイン機能が使えません。

---

## ドメイン制限の変更

異なるGoogle Workspaceドメインに対応させる場合：

```javascript
var SCHOOL_DOMAIN = "your-school.ed.jp";  // ← 変更する
```

空文字列にするとすべてのGoogleアカウントでログイン可能：

```javascript
var SCHOOL_DOMAIN = "";  // 制限なし（開発時のみ推奨）
```

---

## ファイル構成

```
nhigh-portal/
├── index.html   ─ メインのポータル（HTML + CSS + JavaScript 1ファイル）
├── spec.html    ─ 技術仕様書（HTML/CSS/JS/Python/SQL/YAML/Bash）
├── LICENSE      ─ MIT License
└── README.md    ─ このファイル
```

---

## 技術スタック

| 種別 | 内容 |
|---|---|
| フロントエンド | HTML5 / CSS3 / Vanilla JavaScript |
| 認証 | Google Identity Services (OAuth 2.0) |
| データ永続化 | localStorage（JSON形式） |
| ビルドツール | 不要（単一HTMLファイルで動作） |

---

## カスタマイズ

### 学校名・ロゴ

`index.html` 内の以下を書き換える：

```html
<div class="login-logo">N高ポータル<span>SCHOOL PORTAL</span></div>
```

### ニュースのサンプルデータ

`DEFAULT_ITEMS` 配列を書き換えると初期データを変更できます：

```javascript
var DEFAULT_ITEMS = [
  { t:"09:00", c:"school", h:"お知らせのタイトル", m:"補足テキスト", n:true, b:false },
  // ...
];
```

カテゴリ (`c`) の選択肢：`"council"` 生徒会 / `"school"` 学校 / `"club"` 部活 / `"times"` times / `"user"` 生徒投稿

---

## ライセンス

[MIT License](LICENSE) © 2026 kai88-CHANGE

本ソフトウェアはMITライセンスで公開しています。自由に利用・改変・再配布できます。

---

> このポータルは生徒が自分の学校向けにカスタマイズして使うことを想定したオープンソースプロジェクトです。
