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

---

## CampusCoin（学内Web3フリマ）

### システム構成

| レイヤー | 技術 |
|---|---|
| フロントエンド | N高ポータル（バニラHTML/JS） |
| バックエンド | Node.js + TypeScript + Express |
| スマートコントラクト | Solidity 0.8.24 + OpenZeppelin |
| データベース | PostgreSQL + Prisma ORM |
| 認証 | Google Workspace OIDC（サーバーサイド） |
| ブロックチェーン | Ethereum（Sepolia testnet / Hardhat local） |

### 学校SNS認証の設定方法

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. 「APIとサービス」→「OAuth 2.0 クライアントID」を作成（Webアプリ）
3. 「承認済みリダイレクトURI」に以下を追加:

```
開発: http://localhost:3001/auth/google/callback
本番: https://your-domain.jp/auth/google/callback
```

4. `backend/.env` の `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` に設定

### 必要な環境変数

`backend/.env.example` を参照。本番では環境変数管理サービスを使用すること。

### データベースの準備

```bash
cd backend
cp .env.example .env  # 値を設定
npx prisma migrate dev --name init
```

### 配布用ウォレットの準備

1. 新しいEthereumウォレットを作成（秘密鍵を安全に保管）
2. コントラクトをデプロイ（配布ウォレットアドレスをコンストラクタ引数に）:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

3. `DISTRIBUTION_WALLET_PRIVATE_KEY` と `CAMPUS_COIN_ADDRESS` を `.env` に設定
4. 本番では **AWS KMS / Google Cloud KMS** などのHSMを使用すること

### 初回ポイント付与の仕組み

1. Google OIDC認証完了 → `User` レコード作成（provider+subject で一意）
2. MetaMask接続 → サーバーで署名検証 → `walletAddress` 紐付け
3. `POST /api/grant/claim` → `Grant(pending)` を**DB上で先に作成**（一意制約で競合防止）
4. 配布ウォレットから `token.transfer(walletAddress, 10_000 * 10^18)` 実行
5. `CONFIRMATION_BLOCKS` ブロック確認後 `Grant(confirmed)` に更新

### 二重付与防止の仕組み

- DB の `Grant` テーブルに `userId` 一意制約（DB レベルの保証）
- `Grant` レコードを `pending` で先に INSERT → オンチェーン送金は後
- 競合リクエスト（P2002エラー）は既存レコードを返す
- `pending` / `submitted` / `confirmed` / `failed` の状態機械で管理

### ローカル実行方法

```bash
# 1. Hardhat ローカルノード起動
cd contracts && npx hardhat node

# 2. コントラクトデプロイ（別ターミナル）
npx hardhat run scripts/deploy.ts --network localhost

# 3. バックエンド起動（別ターミナル）
cd backend && npm run dev

# 4. フロントエンド: index.html をブラウザで開く
```

### テスト方法

```bash
# コントラクトテスト
cd contracts && npx hardhat test

# バックエンドテスト
cd backend && npm test
```

### セキュリティ注意点

- `DISTRIBUTION_WALLET_PRIVATE_KEY` は本番では KMS/HSM を使用
- `JWT_SECRET` は 64 文字以上のランダム文字列
- Google OIDC の `hd` パラメータ + サーバー側メールドメイン検証の二重チェック
- `state` / `nonce` / PKCE でリプレイ攻撃を防止
- BigInt で 18 decimals を安全に処理（float 使用禁止）

### 本番公開前チェックリスト

- [ ] `NODE_ENV=production`
- [ ] HTTPS を強制
- [ ] `JWT_SECRET` をランダム生成済み
- [ ] `DISTRIBUTION_WALLET_PRIVATE_KEY` を KMS に移行済み
- [ ] PostgreSQL に適切なインデックスが存在する
- [ ] レート制限の閾値を本番向けに調整済み
- [ ] 監査ログの保存先を設定済み
- [ ] コントラクトの外部監査を実施済み

### 未実装事項・運用上のリスク

| 項目 | 状況 |
|---|---|
| エスクローコントラクト | 未実装（直接transferで代替） |
| ウォレット署名のリプレイ攻撃 | nonce消費で対策済み（チェーン番号・有効期限は省略） |
| pending txのタイムアウト処理 | 確認ポーリングジョブは別途実装が必要 |
| KMS連携 | 開発は秘密鍵直接使用、本番はKMS実装が必要 |
| stateStore | 現在はメモリ（本番はRedis推奨） |
