/** A free-roaming, draggable desktop pet with regional-persona dialect quips. */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import {
  type ConversationPeek,
  type SessionRow,
  openSession,
  subscribeCurrentConversation,
  subscribeSessionRows,
} from './conversation-peek.ts'
import {
  DEFAULT_PERSONA,
  PERSONAS,
  PERSONA_LIST,
  type PersonaId,
  type PetShape,
  type Scene,
  asPersonaId,
  pickQuip,
} from './personas.ts'
import { pickFestivalGreeting } from './festivals.ts'
import css from './PetPanel.module.css'

function isInteractiveElement(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, input, select, textarea, label') !== null
}

/** Persisted pet state. */
interface PetState {
  readonly name: string
  readonly level: number
  /**
   * Bond/affinity score in [0, 100]. Grows with successful conversations,
   * token spend, and chat count; drops when a turn fails. Low bond makes the
   * pet's face flush (angry/blush) — see AFFINITY_LOW.
   */
  readonly affinity: number
  readonly mood: 'happy' | 'hungry' | 'sleepy'
  /** Adopted regional persona driving colors + dialect quips. */
  readonly persona: PersonaId
  /** Tokens earned toward the next random pet change. */
  readonly tokenCredit: number
  /** Number of times the user has manually switched to another pet. */
  readonly personaSwitchCount: number
  /** Highest observed token total per session, preventing repeat credit. */
  readonly observedTokens: Readonly<Record<string, number>>
  /** Optional user-uploaded avatar (base64 data URL), shown rounded on the face. */
  readonly avatar?: string
  /** Optional user-uploaded background images (base64 data URLs), up to 5 items. */
  readonly backgrounds?: readonly string[]
  /** Active card theme: image gallery or stock K-line. */
  readonly themeKind?: PetThemeKind
  /** Optional stock-theme config; demo data is used until a live API is configured. */
  readonly stockTheme?: StockThemeConfig
}

interface PetPlacement {
  readonly x: number
  readonly y: number
  readonly fixed: boolean
}

type PetThemeKind = 'gallery' | 'stock'
type StockDataProvider = 'demo' | 'twelvedata'

interface StockThemeConfig {
  readonly provider: StockDataProvider
  readonly symbol: string
  readonly interval: '1day'
  readonly refreshMs: number
  readonly apiKey?: string
}

interface StockCandle {
  readonly time: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

interface StockSnapshot {
  readonly symbol: string
  readonly label: string
  readonly provider: StockDataProvider
  readonly sourceLabel: string
  readonly candles: readonly StockCandle[]
  readonly latest: number
  readonly previousClose: number
  readonly change: number
  readonly changePct: number
  readonly high: number
  readonly low: number
  readonly volume: number
  readonly updatedAt: string
  readonly isDemo: boolean
}

const STORAGE_KEY = 'dsh-ui-pet:state'
const PLACEMENT_KEY = 'dsh-ui-pet:placement'
const APP_VERSION = '0.1.6'

const TOKENS_PER_PERSONA = 1_000_000
const MAX_TOKEN_SESSIONS = 80

/** How long the excited animation + bubble stays before settling back. */
const EXCITED_MS = 3600

/** Roaming cadence: how often the pet may stroll to a new spot when idle. */
const ROAM_MS = 9000

/** Max characters of AI reply text shown before truncating. */
const PEEK_TEXT_MAX = 36

/** Max characters of an error message shown before truncating. */
const PEEK_ERROR_MAX = 48
const STOCK_ERROR_MAX = 60

/** Max data-URL length we persist, to stay under localStorage quota (~5 MB). */
const AVATAR_MAX_CHARS = 4_500_000
/** Longest edge (px) we downscale an uploaded image to before storing. */
const AVATAR_MAX_EDGE = 1200
/** Supported image MIME types for upload. */
const AVATAR_ACCEPT = 'image/*'
const BACKGROUND_MAX_ITEMS = 5
const BACKGROUND_ROTATE_MS = 22_000
const BACKGROUND_FADE_MS = 1_600
const STOCK_POINTS = 42
const STOCK_REFRESH_MS = 5 * 60_000
const STOCK_TIMEOUT_MS = 8_000
const STOCK_ROTATE_MS = 14_000
const DEFAULT_STOCK_SYMBOL = 'AAPL'
const TWELVE_DATA_API_KEYS_URL = 'https://twelvedata.com/account/api-keys'
const PET_VIEWPORT_MARGIN = 16
const ADOPTED_ROAMER_SIZE = { width: 280, height: 260 }
const MENU_ROAMER_SIZE = { width: 520, height: 520 }
const SESSIONS_ROAMER_SIZE = { width: 280, height: 360 }
const UNADOPTED_ROAMER_SIZE = { width: 260, height: 220 }

/** Pixels of pointer travel before a press counts as a drag (not a click). */
const DRAG_THRESHOLD = 0

/** Starting bond for a freshly adopted pet. */
const AFFINITY_START = 60

/** Below this bond the pet's face flushes red (angry/aggrieved). */
const AFFINITY_LOW = 30

/** Bond gained per successful reply / conversation turn. */
const AFFINITY_PER_REPLY = 8

/** Bond gained per newly opened conversation. */
const AFFINITY_PER_SESSION = 5

/** Bond gained per 1k tokens the pet "eats" (spends). */
const AFFINITY_PER_1K_TOKENS = 2

/** Bond lost when a conversation turn fails. */
const AFFINITY_ON_ERROR = 15

/** Trim + ellipsize an AI reply excerpt. */
function excerpt(text: string, max: number = PEEK_TEXT_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

function stockErrorText(error: string | null): string | null {
  if (error === null) return null
  const compact = error.replace(/\s+/g, ' ').trim()
  if (compact === '') return null
  if (compact === 'The user aborted a request.' || compact === 'signal is aborted without reason') {
    return 'Twelve Data request timed out'
  }
  if (compact.includes('Failed to fetch')) return 'Browser request failed'
  return excerpt(compact, STOCK_ERROR_MAX)
}

/** Humanize a token count into a short "food eaten" figure. */
function shortTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function sanitizeObservedTokens(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) return {}
  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, number] => {
      const [sessionId, tokens] = entry
      return sessionId !== '' && typeof tokens === 'number' && Number.isFinite(tokens) && tokens >= 0
    })
    .map(([sessionId, tokens]) => [sessionId, Math.round(tokens)] as const)
  return Object.fromEntries(entries.slice(-MAX_TOKEN_SESSIONS))
}

function observedFromPeek(peek: ConversationPeek | null): Record<string, number> {
  if (peek === null) return {}
  return { [String(peek.sessionId)]: Math.max(0, Math.round(peek.tokens)) }
}

function sanitizeBackgrounds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item !== '')
    .slice(0, BACKGROUND_MAX_ITEMS)
}

function sanitizeThemeKind(value: unknown): PetThemeKind {
  return value === 'stock' ? 'stock' : 'gallery'
}

function sanitizeStockTheme(value: unknown): StockThemeConfig {
  if (typeof value !== 'object' || value === null) return createDefaultStockTheme()
  const source = value as Record<string, unknown>
  const symbol = typeof source.symbol === 'string' && source.symbol.trim() !== ''
    ? parseStockSymbols(source.symbol).join(', ')
    : DEFAULT_STOCK_SYMBOL
  const apiKey = typeof source.apiKey === 'string' && source.apiKey.trim() !== '' ? source.apiKey.trim() : undefined
  return {
    provider: apiKey === undefined ? 'demo' : 'twelvedata',
    symbol,
    interval: '1day',
    refreshMs: typeof source.refreshMs === 'number' && Number.isFinite(source.refreshMs)
      ? clamp(Math.round(source.refreshMs), 30_000, 30 * 60_000)
      : STOCK_REFRESH_MS,
    apiKey,
  }
}

function parseStockSymbols(input: string): string[] {
  const items = input
    .split(',')
    .map(item => item.trim().toUpperCase())
    .filter(item => item !== '')
  return Array.from(new Set(items)).slice(0, 12)
}

function summarizeStockSymbols(symbols: readonly string[], activeIndex: number): string {
  const active = symbols[activeIndex] ?? symbols[0] ?? DEFAULT_STOCK_SYMBOL
  return symbols.length <= 1 ? active : `${active} +${symbols.length - 1}`
}

function createDefaultStockTheme(symbol: string = DEFAULT_STOCK_SYMBOL): StockThemeConfig {
  return {
    provider: 'demo',
    symbol,
    interval: '1day',
    refreshMs: STOCK_REFRESH_MS,
  }
}

function hashSeed(text: string): number {
  let hash = 2166136261
  for (const ch of text) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seedText: string): () => number {
  let seed = hashSeed(seedText) || 1
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
}

function formatPrice(value: number): string {
  const digits = value >= 1000 ? 0 : value >= 100 ? 1 : 2
  return value.toFixed(digits)
}

function shortVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1000).toFixed(1)}k`
  return String(Math.round(value))
}

function buildStockSnapshot(
  candles: readonly StockCandle[],
  symbol: string,
  provider: StockDataProvider,
  sourceLabel: string,
  isDemo: boolean,
): StockSnapshot {
  const series = candles.slice(-STOCK_POINTS)
  const latestCandle = series[series.length - 1] ?? { time: '', open: 0, high: 0, low: 0, close: 0, volume: 0 }
  const previousCandle = series[series.length - 2] ?? latestCandle
  const change = latestCandle.close - previousCandle.close
  const changePct = previousCandle.close === 0 ? 0 : (change / previousCandle.close) * 100
  return {
    symbol,
    label: symbol,
    provider,
    sourceLabel,
    candles: series,
    latest: latestCandle.close,
    previousClose: previousCandle.close,
    change,
    changePct,
    high: Math.max(...series.map(item => item.high)),
    low: Math.min(...series.map(item => item.low)),
    volume: latestCandle.volume,
    updatedAt: latestCandle.time,
    isDemo,
  }
}

function generateDemoCandles(symbol: string): readonly StockCandle[] {
  const random = createSeededRandom(symbol)
  const items: StockCandle[] = []
  const start = 90 + random() * 160
  let lastClose = start
  const baseVolume = 2_000_000 + Math.round(random() * 5_000_000)
  for (let index = STOCK_POINTS + 8; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    const drift = (random() - 0.46) * 5.4
    const swing = 1.2 + random() * 3.6
    const open = Math.max(1, lastClose + (random() - 0.5) * 2.1)
    const close = Math.max(1, open + drift)
    const high = Math.max(open, close) + swing * (0.35 + random() * 0.6)
    const low = Math.max(0.2, Math.min(open, close) - swing * (0.3 + random() * 0.55))
    const volume = Math.round(baseVolume * (0.7 + random() * 0.8) * (1 + Math.abs(close - open) / 12))
    items.push({
      time: date.toISOString().slice(0, 10),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    })
    lastClose = close
  }
  return items
}

function normalizeCandles(input: unknown): StockCandle[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item): StockCandle | null => {
      if (typeof item !== 'object' || item === null) return null
      const row = item as Record<string, unknown>
      const time = typeof row.time === 'string'
        ? row.time
        : typeof row.datetime === 'string'
          ? row.datetime
          : typeof row.date === 'string'
            ? row.date
            : ''
      const open = Number(row.open)
      const high = Number(row.high)
      const low = Number(row.low)
      const close = Number(row.close)
      const volume = Number(row.volume ?? row.vol ?? 0)
      if (time === '' || ![open, high, low, close].every(Number.isFinite)) return null
      return {
        time,
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? Math.max(0, Math.round(volume)) : 0,
      }
    })
    .filter((item): item is StockCandle => item !== null)
    .sort((left, right) => left.time.localeCompare(right.time))
}

function normalizeTwelveDataResponse(payload: unknown, config: StockThemeConfig): StockSnapshot | null {
  if (typeof payload !== 'object' || payload === null) return null
  const source = payload as Record<string, unknown>
  if (typeof source.status === 'string' && source.status.toLowerCase() === 'error') {
    const message = typeof source.message === 'string' ? source.message : 'Twelve Data returned an error'
    throw new Error(message)
  }
  const meta = typeof source.meta === 'object' && source.meta !== null ? source.meta as Record<string, unknown> : {}
  const candles = normalizeCandles(source.values)
  if (candles.length < 2) return null
  const symbol = typeof meta.symbol === 'string' && meta.symbol.trim() !== ''
    ? meta.symbol.trim().toUpperCase()
    : config.symbol
  const exchange = typeof meta.exchange === 'string' && meta.exchange.trim() !== '' ? meta.exchange.trim() : 'Twelve Data'
  const label = typeof meta.currency_base === 'string' && meta.currency_base.trim() !== ''
    ? `${symbol}/${meta.currency_base.trim()}`
    : symbol
  const snapshot = buildStockSnapshot(candles, symbol, 'twelvedata', exchange, false)
  return { ...snapshot, label }
}

async function fetchTwelveDataSnapshot(config: StockThemeConfig, signal: AbortSignal): Promise<StockSnapshot> {
  if (config.apiKey === undefined || config.apiKey === '') throw new Error('Missing Twelve Data API key')
  const query = new URLSearchParams({
    apikey: config.apiKey,
    symbol: config.symbol,
    interval: config.interval,
    outputsize: String(Math.max(60, STOCK_POINTS + 8)),
    timezone: 'Asia/Shanghai',
    previous_close: 'true',
  })
  const response = await fetch(`https://api.twelvedata.com/time_series?${query.toString()}`, { signal })
  if (!response.ok) throw new Error(`Twelve Data HTTP ${response.status}`)
  const payload = await response.json()
  const snapshot = normalizeTwelveDataResponse(payload, config)
  if (snapshot === null) throw new Error('Twelve Data response missing candle values')
  return snapshot
}

async function loadStockSnapshot(config: StockThemeConfig): Promise<StockSnapshot> {
  if (config.provider !== 'twelvedata' || config.apiKey === undefined) {
    return buildStockSnapshot(generateDemoCandles(config.symbol), config.symbol, 'demo', 'Demo market tape', true)
  }
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), STOCK_TIMEOUT_MS)
  try {
    return await fetchTwelveDataSnapshot(config, controller.signal)
  } finally {
    window.clearTimeout(timer)
  }
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, item) => sum + item, 0) / values.length
}

function movingAverage(candles: readonly StockCandle[], period: number): number[] {
  return candles.map((_, index) => {
    const slice = candles.slice(Math.max(0, index - period + 1), index + 1)
    return average(slice.map(item => item.close))
  })
}

function buildPath(values: readonly number[], mapX: (index: number) => number, mapY: (value: number) => number): string {
  return values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${mapX(index).toFixed(1)} ${mapY(value).toFixed(1)}`).join(' ')
}

function renderStockChart(snapshot: StockSnapshot): React.ReactNode {
  const candles = snapshot.candles
  if (candles.length < 2) return null

  const width = 280
  const height = 140
  const left = 12
  const right = 12
  const top = 12
  const bottom = 14
  const volumeHeight = 28
  const plotTop = top + 12
  const plotBottom = height - bottom - volumeHeight
  const plotHeight = plotBottom - plotTop
  const plotWidth = width - left - right
  const gap = plotWidth / Math.max(1, candles.length - 1)
  const candleWidth = Math.max(4, Math.min(8, gap * 0.58))
  const highs = candles.map(item => item.high)
  const lows = candles.map(item => item.low)
  const maxHigh = Math.max(...highs)
  const minLow = Math.min(...lows)
  const pad = Math.max(1, (maxHigh - minLow) * 0.12)
  const domainMin = minLow - pad
  const domainMax = maxHigh + pad
  const maxVolume = Math.max(...candles.map(item => item.volume), 1)
  const ma5 = movingAverage(candles, 5)
  const ma20 = movingAverage(candles, 20)
  const mapX = (index: number) => left + index * gap
  const mapY = (value: number) => plotTop + (domainMax - value) / Math.max(1, domainMax - domainMin) * plotHeight
  const volumeTop = plotBottom + 8
  const areaPath = `M ${mapX(0).toFixed(1)} ${plotBottom.toFixed(1)} ${buildPath(ma5, mapX, mapY).replace(/^M [^ ]+ [^ ]+/, `L ${mapX(0).toFixed(1)} ${mapY(ma5[0] ?? 0).toFixed(1)}`)} L ${mapX(candles.length - 1).toFixed(1)} ${plotBottom.toFixed(1)} Z`
  const up = snapshot.change >= 0
  const lastIndex = candles.length - 1
  const lastCandle = candles[lastIndex]
  const lastX = mapX(lastIndex)
  const lastY = mapY(lastCandle?.close ?? 0)
  const chartId = `pet-stock-${snapshot.symbol.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className={css.stockChart}>
      <defs>
        <linearGradient id={`${chartId}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071427" />
          <stop offset="100%" stopColor="#0d2038" />
        </linearGradient>
        <linearGradient id={`${chartId}-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#36f0a8' : '#ff8d7a'} stopOpacity="0.38" />
          <stop offset="100%" stopColor={up ? '#36f0a8' : '#ff8d7a'} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx="16" fill={`url(#${chartId}-bg)`} />
      <path d={areaPath} fill={`url(#${chartId}-glow)`} opacity="0.9" className={css.stockArea} />
      {[0, 1, 2, 3].map(index => {
        const y = plotTop + plotHeight * (index / 3)
        return <line key={index} x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(160,190,255,0.12)" strokeDasharray="3 4" className={css.stockGrid} />
      })}
      {candles.map((candle, index) => {
        const x = mapX(index)
        const bodyTop = mapY(Math.max(candle.open, candle.close))
        const bodyBottom = mapY(Math.min(candle.open, candle.close))
        const color = candle.close >= candle.open ? '#45f0aa' : '#ff7f74'
        const barHeight = Math.max(2, bodyBottom - bodyTop)
        const volumeBarHeight = (candle.volume / maxVolume) * (volumeHeight - 6)
        return (
          <g key={`${candle.time}-${index}`}>
            <line x1={x} y1={mapY(candle.high)} x2={x} y2={mapY(candle.low)} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
            <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={barHeight} rx="1.4" fill={color} opacity="0.96" />
            <rect x={x - candleWidth / 2} y={volumeTop + (volumeHeight - 4 - volumeBarHeight)} width={candleWidth} height={Math.max(2, volumeBarHeight)} rx="1.2" fill={color} opacity="0.28" />
          </g>
        )
      })}
      <path d={buildPath(ma5, mapX, mapY)} fill="none" stroke="#7fe3ff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" className={css.stockLineFast} />
      <path d={buildPath(ma20, mapX, mapY)} fill="none" stroke="#ffd56c" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" className={css.stockLineSlow} />
      <circle cx={lastX} cy={lastY} r="3.4" fill={up ? '#7ff2bf' : '#ff9f95'} className={css.stockPulse} />
      <circle cx={lastX} cy={lastY} r="7.2" fill="none" stroke={up ? '#7ff2bf' : '#ff9f95'} strokeWidth="1.4" className={css.stockPulseRing} />
      <text x={14} y={18} fill="rgba(232,241,255,0.94)" fontSize="10" fontWeight="700">{snapshot.label}</text>
      <text x={width - 14} y={18} fill={up ? '#6ff7b9' : '#ff9d92'} fontSize="10" fontWeight="700" textAnchor="end">
        {`${up ? '+' : ''}${snapshot.changePct.toFixed(2)}%`}
      </text>
      <text x={14} y={30} fill="rgba(185,202,230,0.78)" fontSize="9">{`${formatPrice(snapshot.latest)} · ${snapshot.sourceLabel}`}</text>
      <text x={width - 14} y={30} fill="rgba(185,202,230,0.72)" fontSize="9" textAnchor="end">{snapshot.updatedAt.slice(5)}</text>
    </svg>
  )
}

function randomIndex(length: number, except?: number): number {
  if (length <= 1) return 0
  const options = Array.from({ length }, (_, index) => index).filter(index => index !== except)
  return options[Math.floor(Math.random() * options.length)] ?? 0
}

function randomPersonaId(except?: PersonaId): PersonaId {
  const options = except === undefined ? PERSONA_LIST : PERSONA_LIST.filter(p => p.id !== except)
  return options[Math.floor(Math.random() * options.length)]?.id ?? DEFAULT_PERSONA
}

/** Start near the lower-right workspace area, not inside the left sidebar. */
function initialPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 120, y: 320 }
  const viewport = viewportRect()
  return clampPosition(
    {
      x: viewport.left + viewport.width - 180,
      y: viewport.top + viewport.height - 240,
    },
    ADOPTED_ROAMER_SIZE,
  )
}

/** Starter placement for a fresh install: egg visible first, not pinned yet. */
function createStarterPlacement(): PetPlacement {
  return {
    ...initialPosition(),
    fixed: false,
  }
}

/** Read the persisted pet placement, tolerating absent/broken storage. */
function loadPlacement(): PetPlacement {
  try {
    const raw = window.localStorage.getItem(PLACEMENT_KEY)
    if (raw === null) return createStarterPlacement()
    const parsed = JSON.parse(raw) as Partial<PetPlacement>
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return createStarterPlacement()
    return {
      x: Math.round(parsed.x),
      y: Math.round(parsed.y),
      fixed: parsed.fixed === true,
    }
  } catch {
    return createStarterPlacement()
  }
}

/** Persist the pet placement, swallowing quota/serialization errors. */
function savePlacement(placement: PetPlacement): void {
  try {
    window.localStorage.setItem(PLACEMENT_KEY, JSON.stringify(placement))
  } catch {
    // best-effort persistence only
  }
}

/** Idle span before the pet proactively speaks up (nudges the user). */
const IDLE_PROMPT_MS = 45_000

/** Running longer than this counts as a "slow turn" for pet prompts. */
const SLOW_TURN_MS = 20_000

/** How often to re-check whether it's late-night and the user is still working. */
const LATE_NIGHT_CHECK_MS = 5 * 60_000
const PHOTO_PAN_BASE_MS = 30_000
const PHOTO_PAN_PX_MS = 190
const PHOTO_ZOOM_NEAR = 1.1
const PHOTO_ZOOM_FAR = 1.03

type PromptStage = 'ready' | 'resume' | 'running' | 'slow' | 'error' | 'crash' | 'completed_first' | 'completed_followup' | 'idle'

function hasConversationHistory(peek: ConversationPeek | null): boolean {
  if (peek === null) return false
  return peek.replyText !== null || peek.error !== null || peek.tokens > 0
}

function sceneForPromptStage(stage: PromptStage): Scene {
  switch (stage) {
    case 'resume': return 'resume'
    case 'running': return 'thinking'
    case 'slow': return 'slow'
    case 'error': return 'error'
    case 'crash': return 'crash'
    case 'completed_followup': return 'followup'
    case 'completed_first': return 'replied'
    case 'idle': return 'idle'
    case 'ready':
    default:
      return 'hello'
  }
}

/** Play a short two-note "done" chime via WebAudio (no asset files needed). */
function playChime(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor === undefined) return
    const ctx = new Ctor()
    const now = ctx.currentTime
    const notes = [880, 1174.66] // A5 → D6, a cheerful little rise.
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.12
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.24)
  })
    window.setTimeout(() => { void ctx.close() }, 600)
  } catch { /* audio may be blocked; ignore */ }
}

/** Per-shape skeleton decorations layered over the shared head/face/body rig.
 *  Each form gets its own silhouette from pure-CSS parts (ears, horns, shell,
 *  fins, …) so tiger / turtle / robot etc. read as distinct creatures. */
function shapeParts(shape: PetShape): React.ReactNode {
  switch (shape) {
    case 'tiger':
      return (
        <>
          <span className={css.earLeft} aria-hidden />
          <span className={css.earRight} aria-hidden />
          <span className={css.stripeA} aria-hidden />
          <span className={css.stripeB} aria-hidden />
        </>
      )
    case 'cat':
      return (
        <>
          <span className={css.earLeft} aria-hidden />
          <span className={css.earRight} aria-hidden />
          <span className={css.whiskerLeft} aria-hidden />
          <span className={css.whiskerRight} aria-hidden />
        </>
      )
    case 'dragon':
      return (
        <>
          <span className={css.hornLeft} aria-hidden />
          <span className={css.hornRight} aria-hidden />
          <span className={css.whiskerLeft} aria-hidden />
          <span className={css.whiskerRight} aria-hidden />
        </>
      )
    case 'turtle':
      return <span className={css.shell} aria-hidden />
    case 'fish':
      return (
        <>
          <span className={css.finTop} aria-hidden />
          <span className={css.tail} aria-hidden />
        </>
      )
    case 'ox':
      return (
        <>
          <span className={css.oxHornLeft} aria-hidden />
          <span className={css.oxHornRight} aria-hidden />
          <span className={css.noseRing} aria-hidden />
        </>
      )
    case 'robot':
    default:
      // The robot's antenna + glossy head are baked into the .head CSS itself.
      return null
    case 'mario':
    case 'wukong':
    case 'nezha':
    case 'niudemon':
    case 'redboy':
    case 'tang':
    case 'pikachu':
    case 'baymax':
    case 'minion':
    case 'spongebob':
    case 'simba':
    case 'po':
    case 'tom':
    case 'jerry':
    case 'mickey':
    case 'donald':
    case 'doraemon':
    case 'goku':
    case 'shinchan':
    case 'conan':
      return null // These shapes have fully custom pixel-art bodies.
  }
}

/** Read the persisted pet, tolerating absent/broken storage. */
function loadPet(_fallbackName: string): PetState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as PetState & { background?: string }
    if (typeof parsed.name !== 'string') return null
    const backgrounds = sanitizeBackgrounds(parsed.backgrounds)
    const stockTheme = sanitizeStockTheme(parsed.stockTheme)
    const legacyBackground = typeof parsed.background === 'string' && parsed.background !== '' ? [parsed.background] : []
    return {
      ...parsed,
      persona: asPersonaId(parsed.persona),
      // Back-compat: old saves predate the bond system.
      affinity: typeof parsed.affinity === 'number' ? clamp(parsed.affinity, 0, 100) : AFFINITY_START,
      tokenCredit: typeof parsed.tokenCredit === 'number' && Number.isFinite(parsed.tokenCredit) ? Math.max(0, parsed.tokenCredit) : 0,
      personaSwitchCount: typeof parsed.personaSwitchCount === 'number' && Number.isFinite(parsed.personaSwitchCount)
        ? Math.max(0, Math.round(parsed.personaSwitchCount))
        : 0,
      observedTokens: sanitizeObservedTokens(parsed.observedTokens),
      backgrounds: backgrounds.length > 0 ? backgrounds : legacyBackground,
      themeKind: sanitizeThemeKind(parsed.themeKind),
      stockTheme,
    }
  } catch {
    return null
  }
}

/** Persist the pet, swallowing quota/serialization errors. */
function savePet(pet: PetState | null): void {
  try {
    if (pet === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pet))
  } catch {
    // best-effort persistence only
  }
}

/** Clamp a value into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

function viewportRect(): { left: number; top: number; width: number; height: number } {
  if (typeof window === 'undefined') return { left: 0, top: 0, width: 1280, height: 720 }
  const viewport = window.visualViewport
  if (viewport !== null && viewport !== undefined) {
    return {
      left: Math.round(viewport.offsetLeft),
      top: Math.round(viewport.offsetTop),
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    }
  }
  return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
}

function clampPosition(
  pos: { x: number; y: number },
  size: { width: number; height: number },
): { x: number; y: number } {
  const viewport = viewportRect()
  const width = Math.max(0, Math.round(size.width))
  const height = Math.max(0, Math.round(size.height))
  const minX = viewport.left + PET_VIEWPORT_MARGIN
  const minY = viewport.top + PET_VIEWPORT_MARGIN
  const maxX = viewport.left + viewport.width - width - PET_VIEWPORT_MARGIN
  const maxY = viewport.top + viewport.height - height - PET_VIEWPORT_MARGIN
  return {
    x: Math.round(maxX < minX ? minX : clamp(pos.x, minX, maxX)),
    y: Math.round(maxY < minY ? minY : clamp(pos.y, minY, maxY)),
  }
}

/** Overlay entry props: frame-wide overlay carries only the standard kit + locale. */
export type PetPanelProps = PropsRuntime<'shell.overlay'> & PropsLocale<'pet'>

/** Render the draggable robot pet with persona quips, an info card, and a session switcher. */
export function PetPanel({ t, useSessions }: PetPanelProps) {
  const [pet, setPet] = useState<PetState | null>(() => loadPet(t(PERSONAS[DEFAULT_PERSONA].nameKey)))
  const [placement] = useState<PetPlacement>(() => loadPlacement())
  const [excited, setExcited] = useState(false)
  const [cheer, setCheer] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [hatching, setHatching] = useState(false)
  const [promptStage, setPromptStage] = useState<PromptStage>('ready')
  // Position in px from the left/top of the viewport, plus facing direction.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({ x: placement.x, y: placement.y }))
  const [fixed, setFixed] = useState(() => placement.fixed)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [walking, setWalking] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Live peek at the current conversation (status + latest AI reply + tokens).
  const [peek, setPeek] = useState<ConversationPeek | null>(null)
  // Switchable conversation rows for the stacked session cards.
  const [rows, setRows] = useState<readonly SessionRow[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roamTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const roamerRef = useRef<HTMLDivElement | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const bgInput = useRef<HTMLInputElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const photoLayerRef = useRef<HTMLDivElement | null>(null)
  const displayBackgroundRef = useRef<string | undefined>(undefined)
  // Drag bookkeeping: pointer origin, pet origin, and whether it became a drag.
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)
  const [photoNatural, setPhotoNatural] = useState<{ width: number; height: number } | null>(null)
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [roamerSize, setRoamerSize] = useState<{ width: number; height: number } | null>(null)
  const [backgroundIndex, setBackgroundIndex] = useState(0)

  const backgrounds = pet?.backgrounds ?? []
  const themeKind = pet?.themeKind ?? 'gallery'
  const stockTheme = pet?.stockTheme ?? createDefaultStockTheme()
  const stockSymbols = useMemo(() => parseStockSymbols(stockTheme.symbol), [stockTheme.symbol])
  const [stockSymbolIndex, setStockSymbolIndex] = useState(0)
  const activeStockSymbol = stockSymbols[stockSymbolIndex] ?? stockSymbols[0] ?? DEFAULT_STOCK_SYMBOL
  const stockEnabled = themeKind === 'stock'
  const activeBackground = backgrounds[backgroundIndex] ?? backgrounds[0]
  const [displayBackground, setDisplayBackground] = useState<string | undefined>(activeBackground)
  const [fadingBackground, setFadingBackground] = useState<string | undefined>(undefined)
  const [backgroundVisible, setBackgroundVisible] = useState(true)
  const [stockSnapshot, setStockSnapshot] = useState<StockSnapshot | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)
  const fallbackRoamerBounds = pet === null
    ? UNADOPTED_ROAMER_SIZE
    : menuOpen
      ? MENU_ROAMER_SIZE
      : sessionsOpen
        ? SESSIONS_ROAMER_SIZE
        : ADOPTED_ROAMER_SIZE
  const roamerBounds = roamerSize ?? fallbackRoamerBounds

  useEffect(() => {
    setStockSymbolIndex(current => current >= stockSymbols.length ? 0 : current)
  }, [stockSymbols])

  useEffect(() => {
    const node = roamerRef.current
    if (node === null) {
      setRoamerSize(null)
      return
    }
    const updateSize = () => {
      const rect = node.getBoundingClientRect()
      const next = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
      setRoamerSize(prev => prev !== null && prev.width === next.width && prev.height === next.height ? prev : next)
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [pet])

  useEffect(() => {
    if (!stockEnabled || stockSymbols.length <= 1) return
    const id = window.setInterval(() => {
      setStockSymbolIndex(current => (current + 1) % stockSymbols.length)
    }, STOCK_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [stockEnabled, stockSymbols])

  useEffect(() => { savePet(pet) }, [pet])

  useEffect(() => {
    savePlacement({ x: pos.x, y: pos.y, fixed })
  }, [pos, fixed])

  useEffect(() => {
    if (fixed) setWalking(false)
  }, [fixed])

  useEffect(() => {
    const keepInBounds = () => {
      setPos(prev => {
        const next = clampPosition(prev, roamerBounds)
        return next.x === prev.x && next.y === prev.y ? prev : next
      })
    }
    keepInBounds()
    const viewport = window.visualViewport
    window.addEventListener('resize', keepInBounds)
    viewport?.addEventListener('resize', keepInBounds)
    viewport?.addEventListener('scroll', keepInBounds)
    return () => {
      window.removeEventListener('resize', keepInBounds)
      viewport?.removeEventListener('resize', keepInBounds)
      viewport?.removeEventListener('scroll', keepInBounds)
    }
  }, [roamerBounds])

  useEffect(() => {
    if (themeKind !== 'gallery') return
    if (backgrounds.length <= 1) {
      setBackgroundIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setBackgroundIndex(current => randomIndex(backgrounds.length, current))
    }, BACKGROUND_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [backgrounds, themeKind])

  useEffect(() => {
    displayBackgroundRef.current = displayBackground
  }, [displayBackground])

  useEffect(() => {
    if (themeKind !== 'gallery') return
    const currentDisplay = displayBackgroundRef.current
    if (activeBackground === currentDisplay) return
    setFadingBackground(currentDisplay)
    setDisplayBackground(activeBackground)
    displayBackgroundRef.current = activeBackground
    setBackgroundVisible(false)
    let cancelled = false
    const raf = window.requestAnimationFrame(() => {
      if (!cancelled) setBackgroundVisible(true)
    })
    const clearId = window.setTimeout(() => {
      if (!cancelled) setFadingBackground(undefined)
    }, BACKGROUND_FADE_MS + 120)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(clearId)
    }
  }, [activeBackground, themeKind])

  useEffect(() => {
    if (themeKind !== 'gallery') {
      setPhotoNatural(null)
      return
    }
    if (displayBackground === undefined) {
      setPhotoNatural(null)
      return
    }
    let disposed = false
    const image = new Image()
    image.onload = () => {
      if (disposed) return
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      if (width > 0 && height > 0) setPhotoNatural({ width, height })
    }
    image.onerror = () => {
      if (!disposed) setPhotoNatural(null)
    }
    image.src = displayBackground
    return () => { disposed = true }
  }, [displayBackground, themeKind])

  useEffect(() => {
    const node = cardRef.current
    if (themeKind !== 'gallery' || node === null || displayBackground === undefined) {
      setCardSize({ width: 0, height: 0 })
      return
    }
    const updateSize = () => {
      const next = {
        width: Math.round(node.clientWidth),
        height: Math.round(node.clientHeight),
      }
      setCardSize(prev => (prev.width === next.width && prev.height === next.height ? prev : next))
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [displayBackground, themeKind])

  useEffect(() => {
    const layer = photoLayerRef.current
    if (layer === null) return
    layer.getAnimations().forEach(animation => animation.cancel())
    layer.style.backgroundPosition = '50% 50%'
    if (themeKind !== 'gallery' || displayBackground === undefined || photoNatural === null || cardSize.width <= 0 || cardSize.height <= 0) return
    const coverScale = Math.max(cardSize.width / photoNatural.width, cardSize.height / photoNatural.height)
    const coverWidth = photoNatural.width * coverScale
    const coverHeight = photoNatural.height * coverScale
    const farWidth = coverWidth * PHOTO_ZOOM_FAR
    const farHeight = coverHeight * PHOTO_ZOOM_FAR
    const nearWidth = coverWidth * PHOTO_ZOOM_NEAR
    const nearHeight = coverHeight * PHOTO_ZOOM_NEAR
    const moveX = Math.max(0, Math.floor((nearWidth - cardSize.width) / 2 - 2))
    const moveY = Math.max(0, Math.floor((nearHeight - cardSize.height) / 2 - 2))
    const startX = moveX > 0 ? `calc(50% - ${moveX}px)` : '50%'
    const endX = moveX > 0 ? `calc(50% + ${moveX}px)` : '50%'
    const startY = moveY > 0 ? `calc(50% - ${moveY}px)` : '50%'
    const endY = moveY > 0 ? `calc(50% + ${moveY}px)` : '50%'
    const distance = (moveX * 4) + (moveY * 4)
    const duration = Math.max(PHOTO_PAN_BASE_MS, Math.round(distance * PHOTO_PAN_PX_MS))
    const farSize = `${Math.round(farWidth)}px ${Math.round(farHeight)}px`
    const nearSize = `${Math.round(nearWidth)}px ${Math.round(nearHeight)}px`
    const animation = layer.animate([
      { backgroundPosition: '50% 50%', backgroundSize: farSize, offset: 0 },
      { backgroundPosition: '50% 50%', backgroundSize: nearSize, offset: 0.14 },
      { backgroundPosition: `${startX} ${startY}`, backgroundSize: nearSize, offset: 0.32 },
      { backgroundPosition: `${endX} ${startY}`, backgroundSize: nearSize, offset: 0.5 },
      { backgroundPosition: `${endX} ${endY}`, backgroundSize: nearSize, offset: 0.68 },
      { backgroundPosition: `${startX} ${endY}`, backgroundSize: nearSize, offset: 0.86 },
      { backgroundPosition: '50% 50%', backgroundSize: farSize, offset: 1 },
    ], {
      duration,
      iterations: Number.POSITIVE_INFINITY,
      easing: 'cubic-bezier(0.38, 0.02, 0.2, 1)',
    })
    return () => animation.cancel()
  }, [displayBackground, photoNatural, cardSize, themeKind])

  const activeStockTheme = useMemo<StockThemeConfig>(() => ({
    ...stockTheme,
    symbol: activeStockSymbol,
  }), [stockTheme, activeStockSymbol])

  useEffect(() => {
    if (!stockEnabled) {
      setStockLoading(false)
      setStockError(null)
      return
    }
    let cancelled = false
    let refreshId: ReturnType<typeof setInterval> | null = null
    const refresh = async () => {
      if (cancelled) return
      setStockLoading(true)
      try {
        const snapshot = await loadStockSnapshot(activeStockTheme)
        if (cancelled) return
        setStockSnapshot(snapshot)
        setStockError(null)
      } catch (error) {
        if (cancelled) return
        const fallback = buildStockSnapshot(generateDemoCandles(activeStockTheme.symbol), activeStockTheme.symbol, 'demo', 'Demo fallback', true)
        const message = error instanceof Error ? error.message : 'K-line API unavailable'
        setStockSnapshot(fallback)
        setStockError(message)
      } finally {
        if (!cancelled) setStockLoading(false)
      }
    }
    void refresh()
    refreshId = window.setInterval(() => { void refresh() }, activeStockTheme.refreshMs)
    return () => {
      cancelled = true
      if (refreshId !== null) window.clearInterval(refreshId)
    }
  }, [stockEnabled, activeStockTheme])

  const persona = PERSONAS[pet?.persona ?? DEFAULT_PERSONA] ?? PERSONAS[DEFAULT_PERSONA]

  // Conversation-activity signal: the session count and current selection.
  const activity = useSessions(s => `${s.ids.length}:${s.current ?? ''}`)
  const firstActivity = useRef(true)
  // Bond bookkeeping edges: last-seen session count, token total, and error state.
  const sessionCount = useSessions(s => s.ids.length)
  const lastSessionCount = useRef(sessionCount)
  const lastErrored = useRef(false)
  // Once-per-day guards for late-night care and festival blessings (keyed by Y-M-D).
  const lastLateNight = useRef<string | null>(null)
  const festivalShown = useRef<string | null>(null)
  // Tracks the running edge so the "done" chime fires once per finished turn.
  const wasRunning = useRef(false)
  const slowTurnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedSessionId = useRef<string | null>(null)
  const turnReplyBaseline = useRef<string | null>(null)
  const turnHadHistory = useRef(false)

  /** Nudge the bond score, clamped to [0, 100]. */
  const bumpAffinity = useCallback((delta: number) => {
    if (delta === 0) return
    setPet(current => (current === null ? current : { ...current, affinity: clamp(current.affinity + delta, 0, 100) }))
  }, [])

  // Subscribe to the current conversation snapshot, re-subscribing on session switch.
  useEffect(() => {
    return subscribeCurrentConversation(setPeek)
  }, [])

  // Subscribe to the switchable session rows.
  useEffect(() => {
    if (pet === null) return
    return subscribeSessionRows(setRows)
  }, [pet])

  /** Speak a quip for the given scene as a transient bubble, using an explicit persona. */
  const speakFor = useCallback((personaId: PersonaId, scene: Scene) => {
    const line = pickQuip(personaId, scene)
    if (line === '') return
    setCheer(line)
    setExcited(true)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setExcited(false)
      setCheer(null)
      timer.current = null
    }, EXCITED_MS)
  }, [])

  /** Speak a persona quip for the given scene using the current persona. */
  const speak = useCallback((scene: Scene) => {
    speakFor(pet?.persona ?? DEFAULT_PERSONA, scene)
  }, [pet?.persona, speakFor])

  /** Show an arbitrary line (e.g. a festival blessing) as a speech bubble. */
  const speakLine = useCallback((line: string) => {
    if (line === '') return
    setCheer(line)
    setExcited(true)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setExcited(false)
      setCheer(null)
      timer.current = null
    }, EXCITED_MS)
  }, [])

  const clearSlowTurnTimer = useCallback(() => {
    if (slowTurnTimer.current !== null) {
      clearTimeout(slowTurnTimer.current)
      slowTurnTimer.current = null
    }
  }, [])

  const armSlowTurnTimer = useCallback(() => {
    clearSlowTurnTimer()
    slowTurnTimer.current = setTimeout(() => {
      setPromptStage(current => (current === 'running' ? 'slow' : current))
      slowTurnTimer.current = null
    }, SLOW_TURN_MS)
  }, [clearSlowTurnTimer])

  // Track conversation lifecycle as a small state machine so the pet prompt
  // only changes on meaningful milestones instead of every streaming tick.
  useEffect(() => {
    if (firstActivity.current) {
      firstActivity.current = false
      trackedSessionId.current = peek === null ? null : String(peek.sessionId)
      wasRunning.current = peek?.running === true
      turnReplyBaseline.current = peek?.replyText ?? null
      setPromptStage(peek?.running === true ? 'running' : hasConversationHistory(peek) ? 'resume' : 'ready')
      if (peek?.running === true) armSlowTurnTimer()
      return
    }
    if (pet === null) return

    const nextSessionId = peek === null ? null : String(peek.sessionId)
    if (trackedSessionId.current !== nextSessionId) {
      trackedSessionId.current = nextSessionId
      wasRunning.current = peek?.running === true
      turnReplyBaseline.current = peek?.replyText ?? null
      clearSlowTurnTimer()
      setPromptStage(peek?.running === true ? 'running' : hasConversationHistory(peek) ? 'resume' : 'ready')
      if (peek?.running === true) armSlowTurnTimer()
      return
    }

    const running = peek?.running === true
    if (!wasRunning.current && running) {
      turnReplyBaseline.current = peek?.replyText ?? null
      turnHadHistory.current = hasConversationHistory(peek)
      setPromptStage('running')
      armSlowTurnTimer()
    }
    if (wasRunning.current && !running) {
      clearSlowTurnTimer()
      const replyText = peek?.replyText ?? null
      const hasNewReply = replyText !== null && replyText !== turnReplyBaseline.current
      if (peek?.error !== null) setPromptStage('error')
      else if (hasNewReply) {
        setPromptStage(turnHadHistory.current ? 'completed_followup' : 'completed_first')
        playChime()
      }
      else setPromptStage('crash')
    }
    wasRunning.current = running
  }, [peek, pet, armSlowTurnTimer, clearSlowTurnTimer])

  // Proactively nudge the user after a stretch of silence (idle small-talk).
  // The timer resets on any activity, hover, or open menu; it fires only while
  // the pet is otherwise quiet, so it never talks over a live conversation.
  useEffect(() => {
    if (pet === null) return
    const busy = peek?.running === true
    if (busy || hovered || menuOpen || excited) return
    const id = window.setTimeout(() => {
      setPromptStage('idle')
      speak('idle')
    }, IDLE_PROMPT_MS)
    return () => window.clearTimeout(id)
  }, [pet, peek?.running, activity, hovered, menuOpen, excited, speak])

  // Late-night care: when the user is still working past 23:00 (or before 05:00),
  // gently remind them to rest. Fires at most once per calendar day, and never
  // while a conversation is live or the pet is otherwise busy.
  useEffect(() => {
    if (pet === null) return
    const check = () => {
      const busy = peek?.running === true
      if (busy || hovered || menuOpen || excited) return
      const now = new Date()
      const hour = now.getHours()
      if (hour < 23 && hour >= 5) return
      const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
      if (lastLateNight.current === today) return
      lastLateNight.current = today
      speak('latenight')
    }
    const id = window.setInterval(check, LATE_NIGHT_CHECK_MS)
    check()
    return () => window.clearInterval(id)
  }, [pet, peek?.running, hovered, menuOpen, excited, speak])

  // Festival blessing: on the day of a known festival, greet the user once with
  // a themed blessing (shown regardless of persona dialect).
  useEffect(() => {
    if (pet === null) return
    const greeting = pickFestivalGreeting()
    if (greeting === '') return
    const now = new Date()
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    if (festivalShown.current === today) return
    festivalShown.current = today
    const id = window.setTimeout(() => { speakLine(greeting) }, 1_500)
    return () => window.clearTimeout(id)
  }, [pet, speakLine])

  // Bond grows when new conversations are opened.
  useEffect(() => {
    if (pet === null) return
    if (sessionCount > lastSessionCount.current) {
      bumpAffinity((sessionCount - lastSessionCount.current) * AFFINITY_PER_SESSION)
    }
    lastSessionCount.current = sessionCount
  }, [sessionCount, pet, bumpAffinity])

  // Bond tracks the live conversation: reward replies + token spend, punish failures.
  useEffect(() => {
    if (pet === null || peek === null) return
    const errored = peek.error !== null
    const wasErrored = lastErrored.current
    setPet(current => {
      if (current === null) return current
      const sessionId = String(peek.sessionId)
      const tokens = Math.max(0, Math.round(peek.tokens))
      const previousTokens = current.observedTokens[sessionId] ?? 0
      const spentTokens = Math.max(0, tokens - previousTokens)
      let delta = spentTokens > 0 ? (spentTokens / 1000) * AFFINITY_PER_1K_TOKENS : 0
      if (errored && !wasErrored) delta -= AFFINITY_ON_ERROR
      else if (!errored && !peek.running && peek.replyText !== null && spentTokens > 0) delta += AFFINITY_PER_REPLY
      if (spentTokens === 0 && delta === 0) return current
      const observedTokens = previousTokens >= tokens
        ? current.observedTokens
        : sanitizeObservedTokens({ ...current.observedTokens, [sessionId]: tokens })
      return {
        ...current,
        affinity: clamp(current.affinity + Math.round(delta), 0, 100),
        tokenCredit: current.tokenCredit + spentTokens,
        observedTokens,
      }
    })
    lastErrored.current = errored
  }, [peek, pet])

  // Whether the AI is actively working right now — drives walk gating + scene.
  const busy = peek !== null && peek.running

  // Free roaming, paused while hovered / menu open / dragging / AI busy.
  useEffect(() => {
    if (pet === null) return
    if (fixed || hovered || menuOpen || sessionsOpen || busy || dragging) return
    const step = () => {
      setPos(prev => {
        const dx = (Math.random() - 0.5) * 240
        const next = clampPosition({
          x: Math.round(prev.x + dx),
          y: Math.round(prev.y + (Math.random() - 0.5) * 120),
        }, roamerBounds)
        if (next.x === prev.x && next.y === prev.y) return prev
        setFacing(next.x >= prev.x ? 1 : -1)
        setWalking(true)
        return next
      })
    }
    const kickoff = setTimeout(step, 1500)
    roamTimer.current = setInterval(step, ROAM_MS)
    return () => {
      clearTimeout(kickoff)
      if (roamTimer.current !== null) clearInterval(roamTimer.current)
      roamTimer.current = null
    }
  }, [pet, fixed, hovered, menuOpen, sessionsOpen, busy, dragging, roamerBounds])

  // Stop the walk cycle shortly after each move settles.
  useEffect(() => {
    if (!walking) return
    const id = setTimeout(() => setWalking(false), 2600)
    return () => clearTimeout(id)
  }, [walking, pos])

  useEffect(() => {
    if (!menuOpen && !sessionsOpen) return
    const onDocumentPointerDown = (event: PointerEvent) => {
      const root = roamerRef.current
      const target = event.target
      if (root !== null && target instanceof Node && root.contains(target)) return
      setMenuOpen(false)
      setSessionsOpen(false)
    }
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }, [menuOpen, sessionsOpen])

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current)
    if (hatchTimer.current !== null) clearTimeout(hatchTimer.current)
    if (slowTurnTimer.current !== null) clearTimeout(slowTurnTimer.current)
  }, [])

  // ---- Drag handlers: pointer down on the egg or pet starts a potential drag. ----
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    drag.current = { px: event.clientX, py: event.clientY, ox: pos.x, oy: pos.y, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [pos.x, pos.y])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (d === null) return
    const dx = event.clientX - d.px
    const dy = event.clientY - d.py
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setMenuOpen(false)
      setSessionsOpen(false)
      setWalking(false)
    }
    setDragging(true)
    setFacing(dx >= 0 ? 1 : -1)
    setPos(prev => {
      const next = clampPosition({ x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) }, roamerBounds)
      return next.x === prev.x && next.y === prev.y ? prev : next
    })
  }, [roamerBounds])

  const hatchEgg = useCallback(() => {
    if (hatching || pet !== null) return
    setHatching(true)
    if (hatchTimer.current !== null) clearTimeout(hatchTimer.current)
    hatchTimer.current = setTimeout(() => {
      const personaId = randomPersonaId()
      const name = PERSONAS[personaId]?.nameKey ?? PERSONAS[DEFAULT_PERSONA].nameKey
      setPet({
        name: t(name),
        level: 1,
        affinity: AFFINITY_START,
        mood: 'happy',
        persona: personaId,
        tokenCredit: 0,
        personaSwitchCount: 0,
        observedTokens: observedFromPeek(peek),
      })
      setHatching(false)
      speakFor(personaId, 'hello')
      hatchTimer.current = null
    }, 1250)
  }, [hatching, peek, pet, speakFor, t])

  const collectEgg = useCallback(() => {
    if (pet === null) return
    setMenuOpen(false)
    setSessionsOpen(false)
    setDragging(false)
    setWalking(false)
    setHovered(false)
    setExcited(false)
    setCheer(null)
    setHatching(false)
    setPet(null)
  }, [pet])

  const finishDrag = useCallback(() => {
    const d = drag.current
    drag.current = null
    if (d !== null && d.moved) setFixed(true)
    setDragging(false)
    return d !== null && d.moved
  }, [])

  const onEggPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
    const dragged = finishDrag()
    if (!dragged) hatchEgg()
  }, [finishDrag])

  const onPetPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
    const dragged = finishDrag()
    if (!dragged) {
      setSessionsOpen(false)
      setMenuOpen(open => !open)
    }
  }, [finishDrag])

  const onPointerCancel = useCallback(() => {
    drag.current = null
    setDragging(false)
  }, [])

  const onLostPointerCapture = useCallback(() => {
    drag.current = null
    setDragging(false)
  }, [])

  const onEggKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    hatchEgg()
  }, [hatchEgg])

  const onPetKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setSessionsOpen(false)
    setMenuOpen(open => !open)
  }, [])

  const openMenuFromCard = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target)) return
    setSessionsOpen(false)
    setMenuOpen(open => !open)
  }, [])

  const rename = useCallback(() => {
    const next = window.prompt(t('panel.namePrompt'))
    if (next !== null && next.trim() !== '') {
      setPet(current => (current === null ? current : { ...current, name: next.trim() }))
    }
    setMenuOpen(false)
  }, [t])

  // Switch to a random new character once enough token credit has been earned.
  const switchPersona = useCallback(() => {
    setPet(current => {
      if (current === null) return current
      const needsTokens = current.personaSwitchCount >= 1
      if (needsTokens && current.tokenCredit < TOKENS_PER_PERSONA) return current
      const personaId = randomPersonaId(current.persona)
      const next = PERSONAS[personaId] ?? PERSONAS[DEFAULT_PERSONA]
      speakFor(next.id, 'hello')
      return {
        ...current,
        name: t(next.nameKey),
        level: 1,
        affinity: AFFINITY_START,
        mood: 'happy',
        persona: next.id,
        avatar: undefined,
        tokenCredit: needsTokens ? current.tokenCredit - TOKENS_PER_PERSONA : current.tokenCredit,
        personaSwitchCount: current.personaSwitchCount + 1,
      }
    })
    setMenuOpen(false)
  }, [speakFor, t])

  /**
   * Shared image-file picker: reads any image format, downscales if needed,
   * and calls `onDone` with the final data URL. Supports JPEG/PNG/GIF/WebP/
   * BMP/SVG/AVIF/ICO and any other format the browser can read.
   */
  const pickImage = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    onDone: (dataUrl: string) => void,
  ) => {
    const file = event.target.files?.[0]
    if (file === undefined) {
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (dataUrl === null) return
      if (dataUrl.length <= AVATAR_MAX_CHARS) {
        onDone(dataUrl)
        return
      }
      const image = new Image()
      image.onload = () => {
        let { width, height } = image
        const maxEdge = Math.max(width, height)
        if (maxEdge > AVATAR_MAX_EDGE) {
          const scale = AVATAR_MAX_EDGE / maxEdge
          width = Math.max(1, Math.round(width * scale))
          height = Math.max(1, Math.round(height * scale))
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx === null) {
          onDone(dataUrl)
          return
        }
        ctx.drawImage(image, 0, 0, width, height)
        let url = canvas.toDataURL('image/png')
        if (url.length > AVATAR_MAX_CHARS) url = canvas.toDataURL('image/jpeg', 0.92)
        if (url.length > AVATAR_MAX_CHARS) {
          for (const q of [0.85, 0.75, 0.6, 0.45, 0.3]) {
            url = canvas.toDataURL('image/jpeg', q)
            if (url.length <= AVATAR_MAX_CHARS) break
          }
        }
        if (url.length > AVATAR_MAX_CHARS) {
          for (const factor of [0.75, 0.5, 0.35, 0.25]) {
            const w = Math.max(1, Math.round(width * factor))
            const h = Math.max(1, Math.round(height * factor))
            canvas.width = w
            canvas.height = h
            ctx.drawImage(image, 0, 0, w, h)
            url = canvas.toDataURL('image/jpeg', 0.7)
            if (url.length <= AVATAR_MAX_CHARS) break
          }
        }
        if (url.length <= AVATAR_MAX_CHARS) onDone(url)
      }
      image.onerror = () => {
        if (dataUrl.length <= AVATAR_MAX_CHARS) onDone(dataUrl)
      }
      image.src = dataUrl
    }
    reader.onerror = () => { /* ignore */ }
    reader.readAsDataURL(file)
    event.target.value = ''
  }, [])

  const pickImages = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    onDone: (dataUrls: string[]) => void,
  ) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      event.target.value = ''
      return
    }
    const outputs: string[] = []
    let index = 0
    const next = () => {
      const file = files[index++]
      if (file === undefined) {
        onDone(outputs)
        event.target.value = ''
        return
      }
      const fakeEvent = { target: { files: [file], value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>
      pickImage(fakeEvent, (dataUrl) => {
        outputs.push(dataUrl)
        next()
      })
    }
    next()
  }, [pickImage])

  const onPickAvatar = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pickImage(event, (dataUrl) => {
      setPet(current => (current === null ? current : { ...current, avatar: dataUrl }))
    })
    setMenuOpen(false)
  }, [pickImage])

  const onPickBackground = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pickImages(event, (dataUrls) => {
      setPet(current => {
        if (current === null) return current
        const existing = current.backgrounds ?? []
        const slots = Math.max(0, BACKGROUND_MAX_ITEMS - existing.length)
        const appended = dataUrls.slice(0, slots)
        return {
          ...current,
          backgrounds: [...existing, ...appended],
        }
      })
    })
    setMenuOpen(false)
  }, [pickImages])

  const uploadAvatar = useCallback(() => {
    setMenuOpen(false)
    requestAnimationFrame(() => fileInput.current?.click())
  }, [])

  const uploadBackground = useCallback(() => {
    setMenuOpen(false)
    requestAnimationFrame(() => bgInput.current?.click())
  }, [])

  const clearAvatar = useCallback(() => {
    setMenuOpen(false)
    setPet(current => (current === null ? current : { ...current, avatar: undefined }))
  }, [])

  const clearBackground = useCallback(() => {
    setMenuOpen(false)
    setPet(current => (current === null ? current : { ...current, backgrounds: [] }))
    setBackgroundIndex(0)
  }, [])

  const useGalleryTheme = useCallback(() => {
    setMenuOpen(false)
    setPet(current => (current === null ? current : { ...current, themeKind: 'gallery' }))
  }, [])

  const useStockTheme = useCallback(() => {
    setMenuOpen(false)
    setPet(current => (current === null ? current : {
      ...current,
      themeKind: 'stock',
      stockTheme: current.stockTheme ?? createDefaultStockTheme(),
    }))
  }, [])

  const configureStockSymbol = useCallback(() => {
    const currentSymbol = pet?.stockTheme?.symbol ?? DEFAULT_STOCK_SYMBOL
    const next = window.prompt(t('panel.stockSymbolPrompt'), currentSymbol)
    if (next !== null && next.trim() !== '') {
      const symbols = parseStockSymbols(next)
      const symbol = symbols.join(', ')
      if (symbol === '') {
        setMenuOpen(false)
        return
      }
      setPet(current => (current === null ? current : {
        ...current,
        themeKind: 'stock',
        stockTheme: {
          ...(current.stockTheme ?? createDefaultStockTheme(symbol)),
          symbol,
        },
      }))
    }
    setMenuOpen(false)
  }, [pet?.stockTheme?.symbol, t])

  const configureTwelveDataKey = useCallback(() => {
    const currentKey = pet?.stockTheme?.apiKey ?? ''
    const next = window.prompt(t('panel.stockApiKeyPrompt'), currentKey)
    if (next !== null) {
      const apiKey = next.trim()
      setPet(current => {
        if (current === null) return current
        const base = current.stockTheme ?? createDefaultStockTheme()
        return {
          ...current,
          themeKind: 'stock',
          stockTheme: {
            ...base,
            provider: apiKey === '' ? 'demo' : 'twelvedata',
            apiKey: apiKey === '' ? undefined : apiKey,
          },
        }
      })
    }
    setMenuOpen(false)
  }, [pet?.stockTheme?.apiKey, t])

  const clearTwelveDataKey = useCallback(() => {
    setMenuOpen(false)
    setPet(current => (current === null ? current : {
      ...current,
      stockTheme: {
        ...(current.stockTheme ?? createDefaultStockTheme()),
        provider: 'demo',
        apiKey: undefined,
      },
    }))
  }, [])

  const openTwelveDataKeys = useCallback(() => {
    window.open(TWELVE_DATA_API_KEYS_URL, '_blank', 'noopener,noreferrer')
    setMenuOpen(false)
  }, [])

  const pickSession = useCallback((id: SessionRow['id']) => {
    openSession(id)
    setSessionsOpen(false)
  }, [])

  const walkClass = walking && !hovered && !busy && !dragging ? (css.walking ?? '') : ''
  const stateClass = dragging ? (css.dragging ?? '') : excited ? (css.excited ?? '') : busy ? (css.busy ?? '') : ''

  // Real conversation info distilled from the live peek: the tool in flight,
  // the AI's actual reply/streaming text, or the real error message.
  const cardInfo = useMemo(() => {
    if (peek === null) return promptStage === 'crash' ? t('info.crash') : null
    if (peek.error !== null) return t('info.error', { text: excerpt(peek.error, PEEK_ERROR_MAX) })
    if (peek.running) {
      if (peek.partialText !== null) return t('info.streaming', { text: excerpt(peek.partialText) })
      return peek.toolName === null
        ? t('info.thinking')
        : t('info.tool', { name: peek.toolName })
    }
    if (promptStage === 'crash') return t('info.crash')
    if (peek.replyText !== null) return t('info.replied', { text: excerpt(peek.replyText) })
    return null
  }, [peek, promptStage, t])

  // Persona quip line: keep pet copy stable per lifecycle node, only letting
  // transient celebrations/holiday lines temporarily override it.
  const cardQuip = useMemo(() => {
    return cheer ?? pickQuip(pet?.persona ?? DEFAULT_PERSONA, sceneForPromptStage(promptStage))
  }, [cheer, pet?.persona, promptStage])

  const statusGlyph = promptStage === 'error' || promptStage === 'crash' ? '⚠️' : busy ? '…' : '✓'
  const tokens = peek?.tokens ?? 0
  const tokenCredit = pet?.tokenCredit ?? 0
  const personaSwitchCount = pet?.personaSwitchCount ?? 0
  const firstSwitchFree = personaSwitchCount < 1
  const canSwitchPersona = firstSwitchFree || tokenCredit >= TOKENS_PER_PERSONA
  const switchRemaining = firstSwitchFree ? 0 : Math.max(0, TOKENS_PER_PERSONA - tokenCredit)
  const switchProgress = Math.min(tokenCredit, TOKENS_PER_PERSONA)
  const galleryActive = themeKind === 'gallery' && displayBackground !== undefined
  const stockChart = useMemo(() => (stockSnapshot === null ? null : renderStockChart(stockSnapshot)), [stockSnapshot])
  const stockChartKey = stockSnapshot === null ? `stock-empty:${activeStockSymbol}` : `${stockSnapshot.symbol}:${stockSnapshot.updatedAt}:${stockSnapshot.latest}`
  const stockSymbolSummary = summarizeStockSymbols(stockSymbols, stockSymbolIndex)
  const stockBadgeTone = (stockSnapshot?.change ?? 0) >= 0 ? css.stockBadgeUp : css.stockBadgeDown
  const stockErrorDetail = stockErrorText(stockError)
  const stockStatusText = stockLoading
    ? t('stock.loading')
    : stockErrorDetail !== null
      ? t('stock.fallbackDetail', { reason: stockErrorDetail })
      : stockSnapshot?.isDemo === true
        ? t('stock.demo')
        : t('stock.liveTwelveData')
  const photoCardStyle = galleryActive
    ? ({ '--pet-card-photo': `url(${displayBackground})` } as CSSProperties)
    : undefined
  const fadingPhotoCardStyle = galleryActive && fadingBackground !== undefined
    ? ({ '--pet-card-photo': `url(${fadingBackground})` } as CSSProperties)
    : undefined

  // Theme variables from the adopted persona (accent colors + fallback face).
  const themeStyle = {
    left: pos.x,
    top: pos.y,
    ['--pet-accent' as string]: persona.accent,
    ['--pet-accent2' as string]: persona.accent2,
  } as React.CSSProperties

  // Not adopted yet: a single adoption egg that hatches into a random pet.
  if (pet === null) {
    return (
      <div ref={roamerRef} className={css.roamer} style={{ left: pos.x, top: pos.y }}>
        <div className={css.adopt}>
          <button
            type="button"
            className={`${css.adoptEgg} ${hatching ? (css.eggHatching ?? '') : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onEggPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
            onKeyDown={onEggKeyDown}
            disabled={hatching}
            aria-label={hatching ? t('panel.hatching') : t('panel.adoptEggButton')}
          >
            <span className={css.eggGlow} aria-hidden />
            <span className={css.eggSparkleA} aria-hidden>✦</span>
            <span className={css.eggSparkleB} aria-hidden>✧</span>
            <span className={css.eggShell} aria-hidden>
              <span className={css.eggTop} />
              <span className={css.eggBottom} />
              <span className={css.eggShine} />
              <span className={css.eggSpeckles} />
              <span className={css.eggCrack} />
            </span>
            <span className={css.eggShadow} aria-hidden />
          </button>
          <div className={css.adoptHint}>{hatching ? t('panel.hatching') : t('panel.adoptEggButton')}</div>
        </div>
      </div>
    )
  }

  // Adopted: pet is non-null from here. Low bond flips the face into a frown
  // and flushes the head (an aggrieved / sulking look).
  const lowBond = pet.affinity < AFFINITY_LOW

  return (
    <div
      ref={roamerRef}
      className={`${css.roamer} ${dragging ? (css.dragActive ?? '') : ''}`}
      style={themeStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Head info card: conversation excerpt + status + token "food" eaten.
          The uploaded background image (if any) is used as the card background. */}
      <div
        ref={cardRef}
        className={stockEnabled ? `${css.card} ${css.cardStock ?? ''}` : galleryActive ? `${css.card} ${css.cardPhoto ?? ''}` : css.card}
        onClick={openMenuFromCard}
      >
        {stockEnabled && stockChart !== null && (
          <div key={stockChartKey} className={`${css.cardStockLayer} ${css.cardStockLayerAnimated ?? ''}`} aria-hidden>{stockChart}</div>
        )}
        {fadingBackground !== undefined && galleryActive && <div className={`${css.cardPhotoLayer} ${css.cardPhotoLayerPrev ?? ''}`} style={fadingPhotoCardStyle} aria-hidden />}
        {galleryActive && (
          <div
            ref={photoLayerRef}
            className={`${css.cardPhotoLayer} ${css.cardPhotoLayerCurrent ?? ''} ${backgroundVisible ? (css.cardPhotoLayerVisible ?? '') : ''}`}
            style={photoCardStyle}
            aria-hidden
          />
        )}
        <div className={css.cardContentRow}>
          <div className={stockEnabled || galleryActive ? `${css.cardBody} ${css.cardBodyGlass ?? ''}` : css.cardBody}>
            {stockEnabled && stockSnapshot !== null && (
              <div className={css.stockInlineMeta}>
                <span className={`${css.stockBadge} ${stockBadgeTone}`}>{`${stockSnapshot.symbol} ${formatPrice(stockSnapshot.latest)}`}</span>
                {stockSymbols.length > 1 && (
                  <span className={css.stockBadgeMuted}>{`${stockSymbolIndex + 1}/${stockSymbols.length}`}</span>
                )}
                <span className={css.stockBadgeMuted}>{t('stock.range', { low: formatPrice(stockSnapshot.low), high: formatPrice(stockSnapshot.high) })}</span>
                <span className={css.stockBadgeMuted}>{t('stock.volume', { count: shortVolume(stockSnapshot.volume) })}</span>
              </div>
            )}
            <div className={css.cardTitle}>{pet.name}</div>
            {cardInfo !== null && <div className={css.cardText}>{cardInfo}</div>}
            <div className={css.cardQuip}>{cardQuip}</div>
          </div>
          <div className={css.cardStatus} aria-hidden>{statusGlyph}</div>
        </div>
        <div className={css.cardMeta}>
          {stockEnabled && (
            <span className={css.stockSource}>{stockStatusText}</span>
          )}
          {tokens > 0 && (
            <span className={css.food}>{t('status.food', { count: shortTokens(tokens) })}</span>
          )}
          {rows.length > 0 && (
            <button
              type="button"
              className={css.sessionsToggle}
              onClick={() => setSessionsOpen(open => !open)}
            >
              {t('status.sessions', { count: rows.length })}
            </button>
          )}
        </div>
      </div>

      {/* Stacked, switchable conversation cards. */}
      {sessionsOpen && rows.length > 0 && (
        <div className={css.sessions}>
          <div className={css.sessionsTitle}>{t('panel.sessions')}</div>
          {rows.map(row => (
            <button
              key={row.id}
              type="button"
              className={`${css.sessionRow} ${row.current ? (css.sessionCurrent ?? '') : ''}`}
              onClick={() => pickSession(row.id)}
            >
              {row.running && <span className={css.sessionDot} aria-hidden />}
              <span className={css.sessionLabel}>{excerpt(row.title)}</span>
            </button>
          ))}
        </div>
      )}

      {/* The pet: a CSS-built skeleton (head + face + body + arms + legs) whose
          per-shape parts (ears, horns, shell, fins, …) give each form a distinct
          silhouette. Robot keeps its antenna/terminal look; draggable.
          Mario gets a fully custom 8-bit pixel-art body instead of the shared rig. */}
      <button
        type="button"
        className={`${css.robot} ${css[persona.shape] ?? ''} ${stateClass} ${walkClass}`}
        style={{
          transform: `scaleX(${facing})`,
          ['--pet-accent' as string]: persona.accent,
          ['--pet-accent2' as string]: persona.accent2,
          ['--accent' as string]: persona.accent,
          ['--accent2' as string]: persona.accent2,
        } as React.CSSProperties}
        aria-label={pet.name}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPetPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onKeyDown={onPetKeyDown}
      >
        {['mario', 'wukong', 'nezha', 'niudemon', 'redboy', 'tang', 'pikachu', 'baymax', 'minion', 'spongebob', 'simba', 'po', 'tom', 'jerry', 'mickey', 'donald', 'doraemon', 'goku', 'shinchan', 'conan'].includes(persona.shape) ? (
          <span className={css[`${persona.shape}Body`] as string} aria-hidden>
            <span className={css[`${persona.shape}Pixel`] as string} />
          </span>
        ) : (
          <>
            {/* Head carries the per-shape decorations plus either the face or an avatar. */}
            <span className={`${css.head} ${lowBond ? (css.blush ?? '') : ''}`} aria-hidden>
              {shapeParts(persona.shape)}
              {/* Un-flip so the face/avatar never renders mirrored while facing left. */}
              <span className={css.faceUnflip} style={{ transform: `scaleX(${facing})` }}>
                {pet.avatar !== undefined ? (
                  <img className={css.avatar} src={pet.avatar} alt="" />
                ) : (
                  <span className={css.face}>
                    <span className={css.eye} />
                    <span className={css.eye} />
                    <span className={`${css.mouth} ${lowBond ? (css.mouthSad ?? '') : ''}`} />
                  </span>
                )}
              </span>
            </span>
            <span className={css.body} aria-hidden />
            <span className={css.armLeft} aria-hidden />
            <span className={css.armRight} aria-hidden />
            <span className={css.legLeft} aria-hidden />
            <span className={css.legRight} aria-hidden />
          </>
        )}
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className={css.hiddenInput}
        onChange={onPickAvatar}
      />

      <input
        ref={bgInput}
        type="file"
        accept="image/*"
        multiple
        className={css.hiddenInput}
        onChange={onPickBackground}
      />

      {menuOpen && (
        <div className={css.menu}>
          <div className={css.menuHeader}>
            <div className={css.menuName}>{pet.name} · {t('status.level', { level: pet.affinity })}</div>
            <div className={css.menuVersion}>v{APP_VERSION}</div>
          </div>
          <div className={css.menuGrid}>
            <section className={css.menuSection}>
              <div className={css.menuSectionTitle}>{t('panel.sectionTheme')}</div>
              <div className={css.menuSectionBody}>
                <button type="button" className={`${css.menuItem} ${themeKind === 'gallery' ? (css.menuItemActive ?? '') : ''}`} onClick={useGalleryTheme}>{t('panel.themeGallery')}</button>
                <button type="button" className={`${css.menuItem} ${themeKind === 'stock' ? (css.menuItemActive ?? '') : ''}`} onClick={useStockTheme}>{t('panel.themeStock')}</button>
                <div className={css.menuHint}>{themeKind === 'stock' ? stockStatusText : t('panel.background', { count: backgrounds.length, max: BACKGROUND_MAX_ITEMS })}</div>
              </div>
            </section>

            <section className={css.menuSection}>
              <div className={css.menuSectionTitle}>{t('panel.sectionStock')}</div>
              <div className={css.menuSectionBody}>
                <button type="button" className={css.menuItem} onClick={configureStockSymbol}>{t('panel.stockSymbol', { symbol: stockSymbolSummary })}</button>
                <button type="button" className={css.menuItem} onClick={openTwelveDataKeys}>{t('panel.stockApiKeyGet')}</button>
                <button type="button" className={css.menuItem} onClick={configureTwelveDataKey}>{t('panel.stockApiKey')}</button>
                {stockTheme.apiKey !== undefined && (
                  <button type="button" className={css.menuItem} onClick={clearTwelveDataKey}>{t('panel.stockApiKeyClear')}</button>
                )}
                {stockSymbols.length > 1 && (
                  <div className={css.menuHint}>{t('stock.watchlist', { current: stockSymbolIndex + 1, total: stockSymbols.length })}</div>
                )}
              </div>
            </section>

            <section className={css.menuSection}>
              <div className={css.menuSectionTitle}>{t('panel.sectionPet')}</div>
              <div className={css.menuSectionBody}>
                <button type="button" className={css.menuItem} onClick={collectEgg}>{t('panel.harvestEgg')}</button>
                <div className={css.menuHint}>{t('panel.petDragHint')}</div>
                <button type="button" className={css.menuItem} onClick={uploadAvatar}>{t('panel.avatar')}</button>
                {pet.avatar !== undefined && (
                  <button type="button" className={css.menuItem} onClick={clearAvatar}>{t('panel.clearAvatar')}</button>
                )}
                <button
                  type="button"
                  className={css.menuItem}
                  onClick={uploadBackground}
                  disabled={backgrounds.length >= BACKGROUND_MAX_ITEMS}
                >
                  {t('panel.background', { count: backgrounds.length, max: BACKGROUND_MAX_ITEMS })}
                </button>
                {backgrounds.length > 0 && (
                  <button type="button" className={css.menuItem} onClick={clearBackground}>{t('panel.clearBackground')}</button>
                )}
                <button type="button" className={css.menuItem} onClick={rename}>{t('panel.rename')}</button>
              </div>
            </section>

            <section className={css.menuSection}>
              <div className={css.menuSectionTitle}>{t('panel.sectionGrowth')}</div>
              <div className={css.menuSectionBody}>
                <div className={css.menuHint}>
                  {firstSwitchFree
                    ? t('panel.personaFirstFree')
                    : t('panel.personaProgress', { count: shortTokens(switchProgress) })}
                </div>
                <button type="button" className={css.menuItem} onClick={switchPersona} disabled={!canSwitchPersona}>
                  {canSwitchPersona
                    ? t('panel.persona')
                    : t('panel.personaLocked', { count: shortTokens(switchRemaining) })}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
