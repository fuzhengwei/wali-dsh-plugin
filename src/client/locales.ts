/** Desktop pet UI dictionaries. */

export const NS = 'pet'

/** Simplified Chinese pet UI messages. */
export const zh = {
  'trigger.label': '桌面宠物',
  'panel.title': '我的宠物',
  'panel.adopt': '领养一只',
  'panel.rename': '改名',
  'panel.avatar': '上传背景',
  'panel.persona': '换个人陪我',
  'panel.sessions': '我的对话',
  'panel.namePrompt': '给宠物起个名字',
  'panel.empty': '还没有宠物，点「领养一只」开始吧',
  'panel.pickPersona': '挑一个中意的性格领养吧',
  'panel.noSessions': '还没有对话，快开始聊点啥～',
  'mood.happy': '开心',
  'mood.hungry': '有点饿',
  'mood.sleepy': '困了',
  'status.level': '亲密度 {level}',
  'status.food': '🍪 吃了 {count} tokens',
  'status.sessions': '💬 {count} 个对话',
  // Live conversation info (real state, not just quips).
  'info.tool': '🔧 正在执行 {name}',
  'info.thinking': '💭 正在思考…',
  'info.replied': '💬 {text}',
  'info.error': '⚠️ 出错：{text}',
  // Persona display names.
  'persona.dongbei.name': '虎威威',
  'persona.chuanyu.name': '龙火火',
  'persona.tianjin.name': '猫俏俏',
  'persona.shanghai.name': '龟慢慢',
  'persona.yuehai.name': '鱼悠悠',
  'persona.shaanxi.name': '牛壮壮',
  'persona.robot.name': '铁蛋蛋',
} satisfies Record<string, string>

/** Translation keys owned by the pet UI namespace. */
export type PetKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Desktop pet UI copy. */
    pet: PetKey
  }
}

/** English pet UI messages. */
export const en = {
  'trigger.label': 'Desktop Pet',
  'panel.title': 'My Pet',
  'panel.adopt': 'Adopt one',
  'panel.rename': 'Rename',
  'panel.avatar': 'Upload background',
  'panel.persona': 'Bring someone new',
  'panel.sessions': 'My chats',
  'panel.namePrompt': 'Name your pet',
  'panel.empty': 'No pet yet — click "Adopt one" to start',
  'panel.pickPersona': 'Pick a persona you like to adopt',
  'panel.noSessions': 'No chats yet — go start one~',
  'mood.happy': 'Happy',
  'mood.hungry': 'A bit hungry',
  'mood.sleepy': 'Sleepy',
  'status.level': 'Bond {level}',
  'status.food': '🍪 Ate {count} tokens',
  'status.sessions': '💬 {count} chats',
  'info.tool': '🔧 Running {name}',
  'info.thinking': '💭 Thinking…',
  'info.replied': '💬 {text}',
  'info.error': '⚠️ Error: {text}',
  'persona.dongbei.name': 'Tiger',
  'persona.chuanyu.name': 'Dragon',
  'persona.tianjin.name': 'Kitty',
  'persona.shanghai.name': 'Turtle',
  'persona.yuehai.name': 'Fishy',
  'persona.shaanxi.name': 'Ox',
  'persona.robot.name': 'Robot',
} satisfies Record<PetKey, string>