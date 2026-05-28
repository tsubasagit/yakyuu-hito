/**
 * DH制モード別のサンプル打順プリセット（架空大学野球チーム）。
 *
 * 試合開始ウィザードから DH モードに応じて自動投入される。
 * 学生オペレーターのデモ・動作確認・本番直前準備を 1 クリックで終わらせるための補助データ。
 *
 * 投手が必ず登録された状態でスタートできるため、ピッチャーテロップ ON/OFF を
 * 試合中いつでも確認できる。
 *
 * （2026-05-28 顧客フィードバック対応: 試合開始時に DH 選択＋サンプル投入で
 * ピッチャー表示できない問題を構造的に解決）
 */
import type { DhMode, LineupPlayer } from '../types'

/** 10番目（投手専用枠）を空で埋めるためのプレースホルダ */
const EMPTY_PITCHER_SLOT: LineupPlayer = {
  order: 10,
  name: '',
  number: '',
  position: '投',
}

// ============================================================================
// 帝都大学 ホワイトイーグルス（先攻デフォルト）
// ============================================================================

/** 帝都・DHあり（10名・投手は10番目） */
export const TEITO_LINEUP_DH: LineupPlayer[] = [
  { order: 1, name: '三輪 蓮', number: '8', position: '中' },
  { order: 2, name: '古谷 颯太', number: '6', position: '遊' },
  { order: 3, name: '上條 蒼真', number: '7', position: '左' },
  { order: 4, name: '神宮 大和', number: '3', position: '一' },
  { order: 5, name: '久保田 凌', number: '9', position: '右' },
  { order: 6, name: '武藤 光輝', number: '24', position: 'DH' },
  { order: 7, name: '桐山 直人', number: '4', position: '二' },
  { order: 8, name: '河合 篤', number: '2', position: '捕' },
  { order: 9, name: '梶 拓海', number: '5', position: '三' },
  { order: 10, name: '倉本 龍之介', number: '1', position: '投' },
]

/** 帝都・DHなし（9名・投手も打席。10番目は空枠） */
export const TEITO_LINEUP_NONE: LineupPlayer[] = [
  { order: 1, name: '三輪 蓮', number: '8', position: '中' },
  { order: 2, name: '古谷 颯太', number: '6', position: '遊' },
  { order: 3, name: '上條 蒼真', number: '7', position: '左' },
  { order: 4, name: '神宮 大和', number: '3', position: '一' },
  { order: 5, name: '久保田 凌', number: '9', position: '右' },
  { order: 6, name: '桐山 直人', number: '4', position: '二' },
  { order: 7, name: '河合 篤', number: '2', position: '捕' },
  { order: 8, name: '梶 拓海', number: '5', position: '三' },
  { order: 9, name: '倉本 龍之介', number: '1', position: '投' },
  EMPTY_PITCHER_SLOT,
]

/** 帝都・二刀流（大谷ルール: 6番DH と 10番投手が同一選手） */
export const TEITO_LINEUP_TWOWAY: LineupPlayer[] = [
  { order: 1, name: '三輪 蓮', number: '8', position: '中' },
  { order: 2, name: '古谷 颯太', number: '6', position: '遊' },
  { order: 3, name: '上條 蒼真', number: '7', position: '左' },
  { order: 4, name: '神宮 大和', number: '3', position: '一' },
  { order: 5, name: '久保田 凌', number: '9', position: '右' },
  { order: 6, name: '倉本 龍之介', number: '1', position: 'DH' },
  { order: 7, name: '桐山 直人', number: '4', position: '二' },
  { order: 8, name: '河合 篤', number: '2', position: '捕' },
  { order: 9, name: '梶 拓海', number: '5', position: '三' },
  { order: 10, name: '倉本 龍之介', number: '1', position: '投' },
]

// ============================================================================
// 早凌大学 ブルーアロウズ（後攻デフォルト）
// ============================================================================

/** 早凌・DHあり（10名・投手は10番目） */
export const SORYO_LINEUP_DH: LineupPlayer[] = [
  { order: 1, name: '高梨 啓人', number: '4', position: '二' },
  { order: 2, name: '安永 慎之介', number: '6', position: '遊' },
  { order: 3, name: '富田 凌空', number: '8', position: '中' },
  { order: 4, name: '黒田 颯', number: '3', position: '一' },
  { order: 5, name: '篠原 蓮', number: '9', position: '右' },
  { order: 6, name: '中野 海斗', number: '22', position: 'DH' },
  { order: 7, name: '平井 玲音', number: '7', position: '左' },
  { order: 8, name: '田所 智樹', number: '2', position: '捕' },
  { order: 9, name: '結城 隼', number: '5', position: '三' },
  { order: 10, name: '速水 翔太郎', number: '11', position: '投' },
]

/** 早凌・DHなし（9名・投手も打席。10番目は空枠） */
export const SORYO_LINEUP_NONE: LineupPlayer[] = [
  { order: 1, name: '高梨 啓人', number: '4', position: '二' },
  { order: 2, name: '安永 慎之介', number: '6', position: '遊' },
  { order: 3, name: '富田 凌空', number: '8', position: '中' },
  { order: 4, name: '黒田 颯', number: '3', position: '一' },
  { order: 5, name: '篠原 蓮', number: '9', position: '右' },
  { order: 6, name: '平井 玲音', number: '7', position: '左' },
  { order: 7, name: '田所 智樹', number: '2', position: '捕' },
  { order: 8, name: '結城 隼', number: '5', position: '三' },
  { order: 9, name: '速水 翔太郎', number: '11', position: '投' },
  EMPTY_PITCHER_SLOT,
]

/** 早凌・二刀流（大谷ルール: 6番DH と 10番投手が同一選手） */
export const SORYO_LINEUP_TWOWAY: LineupPlayer[] = [
  { order: 1, name: '高梨 啓人', number: '4', position: '二' },
  { order: 2, name: '安永 慎之介', number: '6', position: '遊' },
  { order: 3, name: '富田 凌空', number: '8', position: '中' },
  { order: 4, name: '黒田 颯', number: '3', position: '一' },
  { order: 5, name: '篠原 蓮', number: '9', position: '右' },
  { order: 6, name: '速水 翔太郎', number: '11', position: 'DH' },
  { order: 7, name: '平井 玲音', number: '7', position: '左' },
  { order: 8, name: '田所 智樹', number: '2', position: '捕' },
  { order: 9, name: '結城 隼', number: '5', position: '三' },
  { order: 10, name: '速水 翔太郎', number: '11', position: '投' },
]

// ============================================================================
// アクセサ
// ============================================================================

/**
 * 指定チーム・指定 DH モードに対応するサンプル打順を返す。
 * 試合開始ウィザードから呼び出される。
 */
export function getSamplePreset(
  team: 'away' | 'home',
  mode: DhMode,
): LineupPlayer[] {
  if (team === 'away') {
    return mode === 'none'
      ? [...TEITO_LINEUP_NONE]
      : mode === 'twoWay'
        ? [...TEITO_LINEUP_TWOWAY]
        : [...TEITO_LINEUP_DH]
  }
  return mode === 'none'
    ? [...SORYO_LINEUP_NONE]
    : mode === 'twoWay'
      ? [...SORYO_LINEUP_TWOWAY]
      : [...SORYO_LINEUP_DH]
}
