# yakyuu-hito

大学野球オンライン配信向け OBS オーバーレイ。株式会社ひと（坂井遼太郎氏・原田慎氏）専用カスタマイズ版。
[tsubasagit/yakyuu](https://github.com/tsubasagit/yakyuu) v0.3.0 から分岐。

## 背景
- 2026-04-23 キックオフMTG（Gemini議事録参照）
- 予算 20万円 / 納期 2026-08末 / 2026-09 秋季リーグ投入
- 連絡は Facebook Messenger

## 必須4要素
- BSO（ボール・ストライク・アウト）単独表示
- スコアボード単独表示
- 打者名単独表示
- スターティングラインナップ一覧

**各要素はすべて個別に表示/非表示トグル可能であること。**

## 削除する機能（学生運用のため）
- マスコット表示
- 経過ログ（プレーバイプレー）
- 経過時間タイマー
- 打率・HR・打点・OPS等の詳細スタッツ

## 構成
- `/` — ホーム
- `/#/control` — スコアキーパー操作パネル
- `/#/overlay` — OBS用オーバーレイ（透明背景）

## 技術
- React + Vite + TypeScript + Tailwind CSS + Zustand
- BroadcastChannel API でタブ間リアルタイム同期
- localStorage で状態永続化（オフライン対応）

## 開発
```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # 本番ビルド
```

## ルール
- オーバーレイ背景は必ず透明（`background: transparent`）
- チームカラーはHEXコード入力で設定（例: `#e60033`）
- パネルスタイル: `bg-black/80 backdrop-blur-sm rounded-lg`
- BSO色: Ball=緑, Strike=黄, Out=赤
- 学生UX最優先。1クリックで迷わず操作できること

## リポジトリ
- origin: https://github.com/tsubasagit/yakyuu-hito
- 派生元: https://github.com/tsubasagit/yakyuu

## 仕様書
詳細は `SERVICE_SPEC.md` を参照。
