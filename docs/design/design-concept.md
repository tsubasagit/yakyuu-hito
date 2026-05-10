# yakyuu-hito オーバーレイ 全体構想

**参照デザイン**: `docs/design/overlay-mockup.jpg`（坂井氏提供・2026-04-23）

## 1. 設計原則

1. **7つの独立エレメント** — 各要素が物理的に分離され、1要素＝1コンポーネント＝1ストア項目
2. **個別ON/OFF必須** — すべてのエレメントが他要素と無関係にトグル可能
3. **個別ドラッグ配置** — 各エレメントのX/Y座標を独立して記憶
4. **学生1クリック運用** — コントロール画面は「大きなボタン」「見える文字」「迷う余地ゼロ」
5. **デザイン統一** — 黒半透明パネル `bg-black/80 backdrop-blur-sm rounded-lg`、ホワイト文字、角丸8px、オレンジアクセント

## 2. エレメント一覧（7要素）

| # | ID | 名称 | 表示内容 | 主な用途 |
|---|---|---|---|---|
| 1 | `miniScore` | ミニスコア | `A 0 - 0 X` / 9回ウラ | 常時表示の軽量スコア |
| 2 | `pinchHitter` | 代打カード | 代打 / チーム略称 / 選手名 / 学年 / 一行コメント | 代打発表時のみ表示 |
| 3 | `lineup` | スタメン一覧 | 1〜9番 / ポジション / 氏名 / 学年 | 試合開始前・イニング間 |
| 4 | `tournamentHeader` | 大会タイトル | 大会名 / 対戦カード / 会場 / 日付 | 試合前・試合後 |
| 5 | `bigScore` | 大型スコア | チーム略称＋得点＋イニング（大きく） | イニング間・グランド整備中 |
| 6 | `inningScoreboard` | イニング別スコア | 1〜12回＋Rカラム | スコアボード常時表示 |
| 7 | `statusPanel` | 状況パネル | イニング表記＋ダイヤモンド＋A/X簡易スコア＋BSOランプ | 試合進行中常時表示 |

**注**: BSO単体パネル（7の一部）は `statusPanel` に統合。BSOのみ表示したい場合は `statusPanel` の子要素として `bso` `diamond` `quickScore` をさらに内部で分離トグルできる設計にする。

## 3. 状態ストア構成（Zustand）

```ts
interface GameStore {
  // === ゲーム状態 ===
  game: GameState               // イニング、BSO、走者、得点
  teams: { home: Team, away: Team }  // チーム名、略称、カラー(HEX)、選手
  tournament: Tournament        // 大会名、対戦カード、会場、日付
  pinchHitter: PinchHitter | null  // 代打情報

  // === 表示制御（7要素個別） ===
  visibility: {
    miniScore: boolean
    pinchHitter: boolean
    lineup: boolean
    tournamentHeader: boolean
    bigScore: boolean
    inningScoreboard: boolean
    statusPanel: boolean
    // statusPanel 内部
    statusPanel_diamond: boolean
    statusPanel_bso: boolean
    statusPanel_quickScore: boolean
  }

  // === 配置（7要素 × {x, y}） ===
  layout: Record<ElementId, { x: number; y: number }>

  // === アクション ===
  toggleVisibility(id: ElementId): void
  setLayout(id: ElementId, pos: { x: number; y: number }): void
  resetLayout(): void   // mockup と同じ配置に戻す
}
```

## 4. データモデル

```ts
type Team = {
  name: string          // "ABC野球クラブ"
  shortName: string     // "A"（1文字推奨）
  colorHex: string      // "#e60033"
  players: Player[]
}

type Player = {
  uniformNo: number     // 背番号
  position: Position    // 投/捕/一/二/三/遊/左/中/右/代
  name: string
  grade: string         // "3年"
  comment?: string      // 代打時のみ一行コメント
}

type Tournament = {
  title: string         // "全国クラブ野球選手権大会"
  subtitle: string      // "決勝戦"
  venue: string         // "ドリーム競技場"
  date: string          // "2022年1月1日"
}
```

## 5. オーバーレイ画面（`/#/overlay`）レイアウト

デフォルト配置はモックアップに忠実に再現：

```
┌─────────────────────────────────────────────────────────┐
│ [miniScore]                    [pinchHitter]            │
│                                                         │
│ [lineup]                                                │
│  1 ショート...      [tournamentHeader]                  │
│  2 ファースト...                                        │
│  3 サード...        [bigScore]                          │
│  4 レフト...                                            │
│  5 セカンド...                                          │
│  6 センター...                                          │
│  7 ライト...                                            │
│  8 キャッチャー...                                      │
│  9 ピッチャー...                                        │
│                                                         │
│ [inningScoreboard]             [statusPanel]            │
└─────────────────────────────────────────────────────────┘
```

- 各パネル: ドラッグで自由移動、X/Y座標は localStorage 永続化
- リセットボタンでモックアップ配置に戻す
- 背景: 完全透明（OBSブラウザソース）

## 6. コントロール画面（`/#/control`）UX

**最上段に7つのデカいトグルボタンを横並び配置**（学生が真っ先に触る操作）

```
┌──────────────────────────────────────────────────────┐
│ 表示ON/OFF                                           │
│ [ミニスコア] [代打] [スタメン] [大会名]              │
│ [大型スコア] [イニング別] [状況パネル]               │
│                                                      │
│  ──各ボタンは ON=オレンジ / OFF=グレー の2状態──      │
└──────────────────────────────────────────────────────┘
```

下段は**セクション折りたたみ式**で、普段触る頻度順に配置：
1. **試合操作**（BSO・走者・イニング・得点）— 最頻出
2. **代打発表**（代打ボタン → プルダウンで選手選択 → 一行コメント → 表示）
3. **チーム情報**（チーム名・略称・カラーHEX入力・選手CSVインポート）
4. **大会情報**（大会名・対戦カード・会場・日付）
5. **配置リセット**（すべての位置をデフォルトに戻す）

## 7. 学生向けUX方針

| 方針 | 具体化 |
|---|---|
| クリック数最小化 | BSOは「+B」「+S」「+O」＋ワンタップ三振/四球 |
| 誤操作防止 | 削除系は二段階確認、巻き戻しは「前の打者へ」ボタン |
| 視認性 | ボタン最小 48×48px、アクティブ時はオレンジ塗り |
| ラベル日本語のみ | `shortName` `colorHex` 等のラベルは「チーム略称」「チーム色」と表示 |
| エラー排除 | CSV読み込み失敗時はどの行で落ちたか具体的に表示 |
| オフライン動作 | 初回ロード後は完全ローカル |

## 8. 削除する旧機能（yakyuuから継承しない）

- マスコット表示（全削除）
- プレーバイプレーログ
- 経過時間タイマー
- 打率・HR・打点・OPS
- 投手登板数・勝敗・投球数
- 試合前待機画面（「まもなく試合開始」）
- 速報テロップ（ティッカー）※要望が出れば復活検討
- エフェクトアニメーション（初期は全削除、最小限のフェード＋画像呼び出しのみ別途追加）

## 9. 実装フェーズ

| Phase | 期間 | 内容 |
|---|---|---|
| **α (Phase 1)** | 〜5/1 | visibility store / 7要素コンポーネント骨格 / デフォルト配置 / コントロール上段トグル |
| **β (Phase 2)** | 5月中 | CSVインポート / 代打UI / 大会情報UI / ドラッグ配置 / カラーHEX入力 |
| **RC (Phase 3)** | 6〜7月 | エフェクト最小実装 / デザイン最終調整 / 操作マニュアル / 学生向けテスト |
| **本番 (Phase 4)** | 8月 | 運用試験 / 不具合対応 / GitHub Pagesデプロイ |

## 10. コンポーネント配置（src/components/overlay/）

```
src/components/overlay/
├── MiniScore.tsx
├── PinchHitterCard.tsx
├── LineupPanel.tsx
├── TournamentHeader.tsx
├── BigScore.tsx
├── InningScoreboard.tsx
├── StatusPanel.tsx            # diamond + bso + quickScore の合成
│   ├── subcomponents/
│   │   ├── DiamondIndicator.tsx
│   │   ├── BSOLamps.tsx
│   │   └── QuickScore.tsx
└── shared/
    ├── OverlayPanel.tsx       # 全パネルの共通枠（ドラッグ・表示制御）
    └── TeamBadge.tsx          # 略称1文字バッジ（カラー背景）
```

## 11. マイルストーン直近

- [ ] この設計概念書を坂井氏・原田氏に共有しレビュー依頼（Messenger）
- [ ] 5/1 までに Phase α 実装 → ON/OFFだけでも動くデモ
- [ ] CSVサンプル（`docs/sample-roster.csv`）の採用OK確認
- [ ] WBC風デザイン参考画像の追加受領
