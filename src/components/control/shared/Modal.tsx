import { useEffect, useRef, useState } from 'react'

/**
 * アプリ内モーダル（確認・数値入力）。
 *
 * なぜ必要か: OBS のカスタムブラウザドック（CEF）では window.prompt / window.confirm が
 * ブロック・無反応になりやすく、得点修正や試合リセットの確認が「押しても何も起きない」
 * 状態になる。ネイティブダイアログを使わず React で描画することで OBS 内でも確実に動かす。
 * （2026-06-02 顧客フィードバック②③: prompt/confirm をアプリ内UIに置換）
 */

function Backdrop({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface ConfirmModalProps {
  open: boolean
  title: string
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** 確認モーダル（confirm の置換）。Enter=確定 / Esc=キャンセル。 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      else if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-accent hover:bg-accent/80'

  return (
    <Backdrop onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-white text-base font-bold leading-snug">{title}</h3>
        {message && (
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-bold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${confirmClass} text-white px-4 py-2 rounded text-sm font-bold`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Backdrop>
  )
}

interface NumberInputModalProps {
  open: boolean
  title: string
  label?: React.ReactNode
  defaultValue: number
  min?: number
  max?: number
  submitLabel?: string
  onSubmit: (value: number) => void
  onCancel: () => void
  /** 指定すると「空欄にする」ボタンを表示する（得点セルを未記入に戻す用途） */
  onClear?: () => void
  /** 「空欄にする」ボタンのラベル（省略時は「空欄にする」） */
  clearLabel?: string
}

/** 数値入力モーダル（prompt の置換）。±ボタンと数値入力。Enter=確定 / Esc=キャンセル。 */
export function NumberInputModal({
  open,
  title,
  label,
  defaultValue,
  min = 0,
  max = 99,
  submitLabel = '確定',
  onSubmit,
  onCancel,
  onClear,
  clearLabel = '空欄にする',
}: NumberInputModalProps) {
  const [value, setValue] = useState<string>(String(defaultValue))
  const inputRef = useRef<HTMLInputElement>(null)

  // 開いた時・対象セルが変わった時に初期値へリセットし、入力欄を全選択フォーカス
  useEffect(() => {
    if (!open) return
    setValue(String(defaultValue))
    const t = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 30)
    return () => clearTimeout(t)
  }, [open, defaultValue])

  if (!open) return null

  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed >= min && parsed <= max

  const commit = () => {
    if (!valid) return
    onSubmit(clamp(parsed))
  }

  const step = (delta: number) => {
    const base = isNaN(parsed) ? min : parsed
    setValue(String(clamp(base + delta)))
  }

  return (
    <Backdrop onClick={onCancel}>
      <div
        className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-white text-base font-bold leading-snug">{title}</h3>
        {label && <div className="text-gray-400 text-xs">{label}</div>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            className="bg-gray-700 hover:bg-gray-600 text-white w-11 h-11 rounded text-xl font-bold shrink-0"
            aria-label="1減らす"
          >
            −
          </button>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              else if (e.key === 'Escape') onCancel()
            }}
            className="flex-1 min-w-0 bg-gray-900 text-white text-center text-2xl font-mono font-bold rounded px-2 py-2 border border-gray-600"
          />
          <button
            type="button"
            onClick={() => step(1)}
            className="bg-gray-700 hover:bg-gray-600 text-white w-11 h-11 rounded text-xl font-bold shrink-0"
            aria-label="1増やす"
          >
            ＋
          </button>
        </div>
        <div className={`flex gap-2 items-center pt-1 ${onClear ? 'justify-between' : 'justify-end'}`}>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded text-sm font-bold border border-gray-600"
              title="このセルを未記入（空欄）に戻す"
            >
              {clearLabel}
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm font-bold"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={!valid}
              className="bg-accent hover:bg-accent/80 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded text-sm font-bold"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}
