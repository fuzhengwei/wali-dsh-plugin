/** A free-roaming, draggable desktop pet with regional-persona dialect quips. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  /** Highest observed token total per session, preventing repeat credit. */
  readonly observedTokens: Readonly<Record<string, number>>
  /** Optional user-uploaded avatar (base64 data URL), shown rounded on the face. */
  readonly avatar?: string
  /** Optional user-uploaded background image (base64 data URL), shown as card background. */
  readonly background?: string
}

const STORAGE_KEY = 'dsh-ui-pet:state'

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

/** Max data-URL length we persist, to stay under localStorage quota (~5 MB). */
const AVATAR_MAX_CHARS = 4_500_000
/** Longest edge (px) we downscale an uploaded image to before storing. */
const AVATAR_MAX_EDGE = 1200
/** Supported image MIME types for upload. */
const AVATAR_ACCEPT = 'image/*'

/** Pixels of pointer travel before a press counts as a drag (not a click). */
const DRAG_THRESHOLD = 4

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

/** Humanize a token count into a short "food eaten" figure. */
function shortTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function sanitizeObservedTokens(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) return {}
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([sessionId, tokens]) => sessionId !== '' && typeof tokens === 'number' && Number.isFinite(tokens) && tokens >= 0)
    .map(([sessionId, tokens]) => [sessionId, Math.round(tokens)] as const)
  return Object.fromEntries(entries.slice(-MAX_TOKEN_SESSIONS))
}

function observedFromPeek(peek: ConversationPeek | null): Record<string, number> {
  if (peek === null) return {}
  return { [String(peek.sessionId)]: Math.max(0, Math.round(peek.tokens)) }
}

function randomPersonaId(except?: PersonaId): PersonaId {
  const options = except === undefined ? PERSONA_LIST : PERSONA_LIST.filter(p => p.id !== except)
  return options[Math.floor(Math.random() * options.length)]?.id ?? DEFAULT_PERSONA
}

/** Idle span before the pet proactively speaks up (nudges the user). */
const IDLE_PROMPT_MS = 45_000

/** How often to re-check whether it's late-night and the user is still working. */
const LATE_NIGHT_CHECK_MS = 5 * 60_000

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
function loadPet(): PetState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as PetState
    if (typeof parsed.name !== 'string') return null
      return {
        ...parsed,
        persona: asPersonaId(parsed.persona),
        // Back-compat: old saves predate the bond system.
        affinity: typeof parsed.affinity === 'number' ? clamp(parsed.affinity, 0, 100) : AFFINITY_START,
        tokenCredit: typeof parsed.tokenCredit === 'number' && Number.isFinite(parsed.tokenCredit) ? Math.max(0, parsed.tokenCredit) : 0,
        observedTokens: sanitizeObservedTokens(parsed.observedTokens),
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

/** Overlay entry props: frame-wide overlay carries only the standard kit + locale. */
export type PetPanelProps = PropsRuntime<'shell.overlay'> & PropsLocale<'pet'>

/** Render the draggable robot pet with persona quips, an info card, and a session switcher. */
export function PetPanel({ t, useSessions }: PetPanelProps) {
  const [pet, setPet] = useState<PetState | null>(() => loadPet())
  const [excited, setExcited] = useState(false)
  const [cheer, setCheer] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [hatching, setHatching] = useState(false)
  // Position in px from the left/top of the viewport, plus facing direction.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({ x: 120, y: 320 }))
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
  const fileInput = useRef<HTMLInputElement | null>(null)
  const bgInput = useRef<HTMLInputElement | null>(null)
  // Drag bookkeeping: pointer origin, pet origin, and whether it became a drag.
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)

  useEffect(() => { savePet(pet) }, [pet])

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

  // Announce a reply + ring the done chime ONCE when a whole turn finishes,
  // i.e. when the live conversation goes from running -> not running. This
  // avoids chiming on every streamed chunk or intermediate tool step.
  useEffect(() => {
    if (firstActivity.current) {
      firstActivity.current = false
      wasRunning.current = peek?.running === true
      return
    }
    if (pet === null) return
    const running = peek?.running === true
    if (wasRunning.current && !running) {
      // The turn just completed (and it wasn't an error) — celebrate once.
      if (peek === null || peek.error === null) {
        speak('replied')
        playChime()
      }
    }
    wasRunning.current = running
  }, [peek, pet, speak])

  // Proactively nudge the user after a stretch of silence (idle small-talk).
  // The timer resets on any activity, hover, or open menu; it fires only while
  // the pet is otherwise quiet, so it never talks over a live conversation.
  useEffect(() => {
    if (pet === null) return
    const busy = peek?.running === true
    if (busy || hovered || menuOpen || excited) return
    const id = window.setTimeout(() => { speak('idle') }, IDLE_PROMPT_MS)
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
      else if (!errored && !peek.running && peek.aiText !== null && spentTokens > 0) delta += AFFINITY_PER_REPLY
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
    if (hovered || menuOpen || sessionsOpen || busy || dragging) return
    const step = () => {
      const maxX = Math.max(40, window.innerWidth - 140)
      const maxY = Math.max(120, window.innerHeight - 200)
      setPos(prev => {
        const dx = (Math.random() - 0.5) * 240
        const nx = clamp(Math.round(prev.x + dx), 20, maxX)
        const ny = clamp(Math.round(prev.y + (Math.random() - 0.5) * 120), 100, maxY)
        setFacing(nx >= prev.x ? 1 : -1)
        setWalking(true)
        return { x: nx, y: ny }
      })
    }
    const kickoff = setTimeout(step, 1500)
    roamTimer.current = setInterval(step, ROAM_MS)
    return () => {
      clearTimeout(kickoff)
      if (roamTimer.current !== null) clearInterval(roamTimer.current)
      roamTimer.current = null
    }
  }, [pet, hovered, menuOpen, sessionsOpen, busy, dragging])

  // Stop the walk cycle shortly after each move settles.
  useEffect(() => {
    if (!walking) return
    const id = setTimeout(() => setWalking(false), 2600)
    return () => clearTimeout(id)
  }, [walking, pos])

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current)
    if (hatchTimer.current !== null) clearTimeout(hatchTimer.current)
  }, [])

  // ---- Drag handlers: pointer down on the robot starts a potential drag. ----
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
    d.moved = true
    setDragging(true)
    const maxX = Math.max(20, window.innerWidth - 120)
    const maxY = Math.max(80, window.innerHeight - 160)
    const nx = clamp(Math.round(d.ox + dx), 8, maxX)
    const ny = clamp(Math.round(d.oy + dy), 60, maxY)
    setFacing(dx >= 0 ? 1 : -1)
    setPos({ x: nx, y: ny })
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* ignore */ }
    // A press that never crossed the drag threshold is a click → toggle menu.
    if (d !== null && !d.moved) setMenuOpen(open => !open)
    // Settle drag state on the next tick so the click above wins first.
    setDragging(false)
  }, [])

  // ---- Adoption + care actions. ----
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
        observedTokens: observedFromPeek(peek),
      })
      setHatching(false)
      speakFor(personaId, 'hello')
      hatchTimer.current = null
    }, 1250)
  }, [hatching, peek, pet, speakFor, t])

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
      if (current.tokenCredit < TOKENS_PER_PERSONA) return current
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
        tokenCredit: current.tokenCredit - TOKENS_PER_PERSONA,
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

  const onPickAvatar = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pickImage(event, (dataUrl) => {
      setPet(current => (current === null ? current : { ...current, avatar: dataUrl }))
    })
    setMenuOpen(false)
  }, [pickImage])

  const onPickBackground = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    pickImage(event, (dataUrl) => {
      setPet(current => (current === null ? current : { ...current, background: dataUrl }))
    })
    setMenuOpen(false)
  }, [pickImage])

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
    setPet(current => (current === null ? current : { ...current, background: undefined }))
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
    if (peek === null) return null
    if (peek.error !== null) return t('info.error', { text: excerpt(peek.error, PEEK_ERROR_MAX) })
    if (peek.running) {
      return peek.toolName === null
        ? t('info.thinking')
        : t('info.tool', { name: peek.toolName })
    }
    if (peek.aiText !== null) return t('info.replied', { text: excerpt(peek.aiText) })
    return null
  }, [peek, t])

  // Persona quip line: a transient cheer, else a scene-appropriate idle quip.
  const cardQuip = useMemo(() => {
    if (peek !== null) {
      if (peek.error !== null) return pickQuip(pet?.persona ?? DEFAULT_PERSONA, 'error')
      if (peek.running) return pickQuip(pet?.persona ?? DEFAULT_PERSONA, peek.toolName === null ? 'thinking' : 'analyzing')
    }
    return cheer ?? pickQuip(pet?.persona ?? DEFAULT_PERSONA, 'idle')
  }, [peek, cheer, pet?.persona])

  const statusGlyph = peek !== null && peek.error !== null ? '⚠️' : busy ? '…' : '✓'
  const tokens = peek?.tokens ?? 0
  const tokenCredit = pet?.tokenCredit ?? 0
  const canSwitchPersona = tokenCredit >= TOKENS_PER_PERSONA
  const switchRemaining = Math.max(0, TOKENS_PER_PERSONA - tokenCredit)
  const switchProgress = Math.min(tokenCredit, TOKENS_PER_PERSONA)

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
      <div className={css.roamer} style={{ left: pos.x, top: pos.y }}>
        <div className={css.adopt}>
          <div className={css.adoptTitle}>{t('panel.adoptEggTitle')}</div>
          <div className={css.adoptText}>{t('panel.adoptEggText')}</div>
          <button
            type="button"
            className={`${css.adoptEgg} ${hatching ? (css.eggHatching ?? '') : ''}`}
            onClick={hatchEgg}
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
      className={`${css.roamer} ${dragging ? (css.dragActive ?? '') : ''}`}
      style={themeStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Head info card: conversation excerpt + status + token "food" eaten.
          The uploaded background image (if any) is used as the card background. */}
      <div
        className={pet.background !== undefined ? `${css.card} ${css.cardPhoto ?? ''}` : css.card}
        style={
         pet.background !== undefined
            ? {
                backgroundImage: `url(${pet.background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className={css.cardContentRow}>
          <div className={pet.background !== undefined ? `${css.cardBody} ${css.cardBodyGlass ?? ''}` : css.cardBody}>
            <div className={css.cardTitle}>{pet.name}</div>
            {cardInfo !== null && <div className={css.cardText}>{cardInfo}</div>}
            <div className={css.cardQuip}>{cardQuip}</div>
          </div>
          <div className={css.cardStatus} aria-hidden>{statusGlyph}</div>
        </div>
        <div className={css.cardMeta}>
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
        onPointerUp={onPointerUp}
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
        className={css.hiddenInput}
        onChange={onPickBackground}
      />

      {menuOpen && (
        <div className={css.menu}>
          <div className={css.menuName}>{pet.name} · {t('status.level', { level: pet.affinity })}</div>
          <button type="button" className={css.menuItem} onClick={uploadAvatar}>{t('panel.avatar')}</button>
          {pet.avatar !== undefined && (
            <button type="button" className={css.menuItem} onClick={clearAvatar}>{t('panel.clearAvatar')}</button>
          )}
          <button type="button" className={css.menuItem} onClick={uploadBackground}>{t('panel.background')}</button>
          {pet.background !== undefined && (
            <button type="button" className={css.menuItem} onClick={clearBackground}>{t('panel.clearBackground')}</button>
          )}
          <div className={css.menuHint}>{t('panel.personaProgress', { count: shortTokens(switchProgress) })}</div>
          <button type="button" className={css.menuItem} onClick={switchPersona} disabled={!canSwitchPersona}>
            {canSwitchPersona ? t('panel.persona') : t('panel.personaLocked', { count: shortTokens(switchRemaining) })}
          </button>
          <button type="button" className={css.menuItem} onClick={rename}>{t('panel.rename')}</button>
        </div>
      )}
    </div>
  )
}
