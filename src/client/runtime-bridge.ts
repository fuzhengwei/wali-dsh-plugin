/** Module-level bridge that hands the live ClientContext to overlay components. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'

/** The captured context, set once during {@link apply}. */
let petCtx: ClientContext | null = null

/** Store the context so frame-wide overlay components can reach ctx.sessions. */
export function setPetRuntime(ctx: ClientContext): void {
  petCtx = ctx
}

/** Read the captured context, or null before apply has run. */
export function getPetRuntime(): ClientContext | null {
  return petCtx
}