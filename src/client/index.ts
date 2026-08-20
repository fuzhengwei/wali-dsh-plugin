/** Desktop pet browser surface: a free-roaming pet floating over the whole app. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { PetPanel } from './PetPanel.tsx'
import { en, NS, zh } from './locales.ts'
import { setPetRuntime } from './runtime-bridge.ts'

export type { PetKey } from './locales.ts'
export type { PetPanelProps } from './PetPanel.tsx'

/** Required services: the slot registry, the locale registry, plus sessions for conversation peeking. */
export const inject = ['slots', 'locale', 'sessions']

/** Register the pet dictionaries and mount the pet into the frame-wide overlay. */
export function apply(ctx: ClientContext): void {
  // Capture the context so the frame-wide overlay pet can subscribe to the
  // current conversation snapshot (overlay slots carry no session-scope props).
  setPetRuntime(ctx)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-pet: dictionaries')

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      { name: 'shell.overlay', id: 'pet-roamer', order: 200, locale: NS },
      PetPanel,
    ),
  )
}