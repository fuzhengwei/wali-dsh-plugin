/**
 * Peek at the current conversation for the free-roaming pet.
 *
 * The pet lives in the frame-wide `shell.overlay` (root scope), so it only
 * receives global props (useSessions/useWorkspaces) and never the session-scope
 * `useSession`. To still "understand" the live chat, we reach through the
 * captured ctx: `ctx.sessions.list` gives the current session id, and
 * `ctx.sessions.binding(id).session` is an ObservableSnapshot<ConversationSnapshot>
 * we can subscribe to directly.
 */

import type {
  AssistantBlock,
  AssistantMessageNode,
  ConversationSnapshot,
  SessionId,
} from '@deepseek-ai/dsh-client-runtime/client'
import { getPetRuntime } from './runtime-bridge.ts'

/** A compact, pet-friendly read of what the AI is doing right now. */
export interface ConversationPeek {
  /** Current session id, used to avoid double-counting token spend. */
  readonly sessionId: SessionId
  /** Whether the agent is currently generating a turn. */
  readonly running: boolean
  /** The first in-flight tool name, when a tool call is running. */
  readonly toolName: string | null
  /** The latest AI text — streaming partial first, else the last finalized reply. */
  readonly aiText: string | null
  /** The most recent agent error, when the last turn failed. */
  readonly error: string | null
  /** Total tokens (input + output) summed over every assistant node so far. */
  readonly tokens: number
}

/** One switchable conversation row shown as a stacked card in the pet UI. */
export interface SessionRow {
  /** Session id, passed to {@link openSession} on click. */
  readonly id: SessionId
  /** Display title (durable title, cwd basename, or raw id). */
  readonly title: string
  /** Whether this session is the one currently selected. */
  readonly current: boolean
  /** Whether the agent in this session is running right now. */
  readonly running: boolean
}

/** Read input+output token counts off an assistant node's optional usage record. */
function nodeTokens(usage: unknown): number {
  if (typeof usage !== 'object' || usage === null) return 0
  const record = usage as { inputTokens?: unknown; outputTokens?: unknown }
  const input = typeof record.inputTokens === 'number' && Number.isFinite(record.inputTokens) ? record.inputTokens : 0
  const output = typeof record.outputTokens === 'number' && Number.isFinite(record.outputTokens) ? record.outputTokens : 0
  return Math.max(0, input) + Math.max(0, output)
}

/** Sum tokens across all assistant nodes in the conversation. */
function totalTokens(snapshot: ConversationSnapshot): number {
  let sum = 0
  for (const node of snapshot.nodes) {
    if (node.kind === 'assistant') sum += nodeTokens((node as AssistantMessageNode).usage)
  }
  return sum
}

/** Find the first `text` block in an assistant block list. */
function firstText(blocks: readonly AssistantBlock[]): string | null {
  for (const block of blocks) {
    if (block.kind === 'text' && block.text.trim() !== '') return block.text.trim()
  }
  return null
}

/** Walk nodes from the end to the newest finalized assistant text. */
function lastAssistantText(snapshot: ConversationSnapshot): string | null {
  const { nodes } = snapshot
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (node?.kind === 'assistant') {
      const text = firstText((node as AssistantMessageNode).blocks)
      if (text !== null) return text
    }
  }
  return null
}

/** Collapse a full ConversationSnapshot into the pet's compact peek. */
function toPeek(sessionId: SessionId, snapshot: ConversationSnapshot): ConversationPeek {
  const partialText = snapshot.partial === null ? null : firstText(snapshot.partial.blocks)
  return {
    sessionId,
    running: snapshot.running,
    toolName: snapshot.runningCalls[0]?.name ?? null,
    aiText: partialText ?? lastAssistantText(snapshot),
    error: snapshot.lastAgentError,
    tokens: totalTokens(snapshot),
  }
}

/**
 * Subscribe to the current conversation and receive a compact peek whenever it
 * changes — including when the user switches sessions. Returns a disposer that
 * tears down both the session-list watch and the active conversation watch.
 *
 * @param onChange - invoked with the latest peek (or null when no session).
 * @returns a cleanup function.
 */
export function subscribeCurrentConversation(
  onChange: (peek: ConversationPeek | null) => void,
): () => void {
  const ctx = getPetRuntime()
  if (ctx === null) {
    onChange(null)
    return () => {}
  }

  let currentId: string | undefined
  let disposeConversation: (() => void) | null = null

  const watchConversation = () => {
    const next = ctx.sessions.list.getSnapshot().current
    if (next === currentId) return
    currentId = next
    if (disposeConversation !== null) {
      disposeConversation()
      disposeConversation = null
    }
    if (next === undefined) {
      onChange(null)
      return
    }
    const binding = ctx.sessions.binding(next)
    if (binding === undefined) {
      onChange(null)
      return
    }
    const emit = () => onChange(toPeek(next, binding.session.getSnapshot()))
    disposeConversation = binding.session.subscribe(emit)
    emit()
  }

  const disposeList = ctx.sessions.list.subscribe(watchConversation)
  watchConversation()

  return () => {
    disposeList()
    if (disposeConversation !== null) disposeConversation()
  }
}

/**
 * Subscribe to the session list and receive switchable conversation rows
 * whenever it changes. Non-blank sessions only, newest first, capped for the
 * compact pet UI.
 *
 * @param onChange - invoked with the latest rows (empty when no sessions).
 * @param limit - maximum rows to surface (default 6).
 * @returns a cleanup function.
 */
export function subscribeSessionRows(
  onChange: (rows: readonly SessionRow[]) => void,
  limit = 6,
): () => void {
  const ctx = getPetRuntime()
  if (ctx === null) {
    onChange([])
    return () => {}
  }
  const emit = () => {
    const snapshot = ctx.sessions.list.getSnapshot()
    const rows: SessionRow[] = []
    for (const id of snapshot.ids) {
      const item = snapshot.byId[id]
      if (item === undefined || item.blank) continue
      rows.push({
        id: item.id,
        title: item.displayTitle,
        current: item.id === snapshot.current,
        running: item.running,
      })
    }
    // Newest first: the list is oldest-first render order, so reverse it.
    rows.reverse()
    onChange(rows.slice(0, limit))
  }
  const dispose = ctx.sessions.list.subscribe(emit)
  emit()
  return dispose
}

/**
 * Switch the frame to the given session id, if the runtime is available.
 * @param id - the session id to open as current.
 */
export function openSession(id: SessionId): void {
  const ctx = getPetRuntime()
  ctx?.sessions.open(id)
}
