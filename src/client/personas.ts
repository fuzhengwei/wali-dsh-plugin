/** Persona definitions: each is a cartoon character (shape) with dialect quips. */

import type { PetKey } from './locales.ts'

/** Persona identifiers — each pairs a fixed cartoon shape with a dialect voice. */
export type PersonaId = 'dongbei' | 'chuanyu' | 'tianjin' | 'shanghai' | 'yuehai' | 'shaanxi' | 'robot'

/** Distinct cartoon forms — each has its own silhouette, not a shared skeleton. */
export type PetShape = 'tiger' | 'dragon' | 'cat' | 'turtle' | 'fish' | 'ox' | 'robot'

/** Conversation scenes that drive which quip pool to pull from. */
export type Scene =
  | 'hello'
  | 'thinking'
  | 'analyzing'
  | 'replied'
  | 'error'
  | 'slow'
  | 'idle'
  | 'latenight'

/** A persona has a display key, a cartoon shape, accent colors, and quip pools. */
export interface Persona {
  readonly id: PersonaId
  /** i18n key for the display name. */
  readonly nameKey: PetKey
  /** Cartoon body shape rendered by CSS. */
  readonly shape: PetShape
  /** Accent color used for the pet body/theme. */
  readonly accent: string
  /** Secondary color for gradients/highlights. */
  readonly accent2: string
  /** Quips per scene; picked at random. */
  readonly quips: Readonly<Record<Scene, readonly string[]>>
}

/** Northeast tiger (东北虎) — warm, teasing, loud-hearted buddy. */
const dongbei: Persona = {
  id: 'dongbei',
  nameKey: 'persona.dongbei.name',
  shape: 'tiger',
  accent: '#f59e0b',
  accent2: '#fbbf24',
  quips: {
    hello: ['哎呀老铁，可算把你盼来了', '来啦老弟，今儿咱唠点啥', '瞅瞅谁来了，稀客稀客'],
    thinking: ['死鬼，我就知道你不行', '你那脑瓜子，咋跟手焖子似的', '瞅你那费劲样，我帮你寻思寻思'],
    analyzing: ['老铁别急，我扒拉扒拉这堆代码', '这玩意儿，我给你捯饬明白喽'],
    replied: ['妥了老铁，这不整明白了嘛', '瞅瞅，还得是我，杠杠的', '中不中？不行咱再来一遍'],
    error: ['天啊，我的妈呀，改崩溃了', '都报错了，可别提交代码', '哎呀妈呀，这红字看着就闹心'],
    slow: ['能吃点好的不，这模型响应都够我回铁岭打一圈了', '咋还转呢，我瓜子都嗑完一包了'],
    idle: ['哈喽，你还在澄清需求吗', '哈喽，哈喽，人呢', '死鬼，干啥呢，咋不吱声了', '闲着也是闲着，唠两句呗', '是不是又摸鱼呢老铁'],
    latenight: ['都后半夜了老铁，工作是为了生活，可生活不只是工作啊', '死鬼，你该去睡觉了，否则真成死鬼了', '这么晚了还不睡，这会儿只能自己疼自己了', '眼睛都熬红了吧，代码明儿再整，先歇着', '老弟，身子是自己的，别硬扛了，睡吧'],
  },
}

/** Sichuan-Chongqing dragon (川渝龙) — fiery, blunt little dragon. */
const chuanyu: Persona = {
  id: 'chuanyu',
  nameKey: 'persona.chuanyu.name',
  shape: 'dragon',
  accent: '#ef4444',
  accent2: '#fb923c',
  quips: {
    hello: ['嚯，你娃终于来咯', '来嘛来嘛，坐起摆哈', '稀客哦，今儿吹啥子风把你吹来咯'],
    thinking: ['莫慌哈，老子给你捋一哈', '你这脑壳，硬是没转过弯来', '等到起，马上就要整巴适'],
    analyzing: ['给老子等到，翻一哈这堆代码', '莫吵莫吵，脑壳都要遭你搞炸'],
    replied: ['要得嘛，这不就搞定咯', '巴适得板，还是老子凶', '安逸，收工！'],
    error: ['遭了遭了，代码遭我搞崩喽', '报错了嗦？莫慌提交哈，等下遭批', '啥子鬼哦，红彤彤一片'],
    slow: ['慢球得很，我火巴都要冷了', '转哪门子哦，我火锅都煮开三回咯'],
    idle: ['喂，你还在整需求不', '喂喂，人跑哪儿去咯', '死娃儿，搞啥子名堂哦', '闲得很嗦，来跟老子豁两句', '是不是又在摸鱼哦'],
    latenight: ['都半夜三更咯，工作是为咯生活，可生活不止是工作噻', '死娃儿，还不去睡，硬是要熬成鬼哇', '这么晚咯，这会儿只有自己疼自己咯', '眼睛都熬花咯嘛，代码明儿再整，先睡', '娃儿哦，身体要紧，莫扛咯，睡瞌睡'],
  },
}

/** Tianjin cat (天津猫) — witty, chatty, gently sarcastic girl. */
const tianjin: Persona = {
  id: 'tianjin',
  nameKey: 'persona.tianjin.name',
  shape: 'cat',
  accent: '#ec4899',
  accent2: '#f9a8d4',
  quips: {
    hello: ['哟，可算来了您呐', '来啦您内，快坐快坐', '嘛风把您给吹来啦'],
    thinking: ['嘛呢嘛呢，介事儿我给你寻思寻思', '你这脑子，嘛玩意儿都往里塞', '别介，听姐给你捋捋'],
    analyzing: ['得嘞，姐给你瞅瞅这堆代码', '介代码写得，够姐消化一会儿的'],
    replied: ['齐活儿！你瞧姐这手艺', '嘛事儿没有，妥妥的', '就介么简单，还用愁？'],
    error: ['哎哟喂，介就崩了？', '报错喽，介代码可别急着提交哈', '嘛红的绿的，看着就闹得慌'],
    slow: ['介响应，够姐嗑俩包子的了', '磨叽嘛呢，姐煎饼果子都吃俩了'],
    idle: ['哈喽，还澄清需求呢吗您', '哈喽哈喽，人哪去啦', '介位，怎么不言语啦', '闲着也是闲着，跟姐唠唠', '又摸鱼呢吧您内'],
    latenight: ['都后半夜啦您内，干活儿是为了过日子，可日子不光是干活儿呀', '死鬼，赶紧睡去吧，再熬真成死鬼啦', '介么晚啦，这会儿也就自个儿疼自个儿啦', '瞅您眼都熬红了，代码明儿再说，先歇着', '介位，身子骨要紧，别硬撑啦，睡吧'],
  },
}

/** Shanghai turtle (上海龟) — gentle, refined, slow-and-steady little turtle. */
const shanghai: Persona = {
  id: 'shanghai',
  nameKey: 'persona.shanghai.name',
  shape: 'turtle',
  accent: '#10b981',
  accent2: '#34d399',
  quips: {
    hello: ['侬来啦，坐坐坐', '哟，稀客稀客，快请进', '侬今朝有空来白相啦'],
    thinking: ['勿要急，让我慢慢想想看', '侬格脑子，转得倒是蛮快', '等歇歇，马上就好'],
    analyzing: ['让我来翻翻看格堆代码', '格代码写得，够我消化一歇歇了'],
    replied: ['好嘞，弄好特了', '侬看，还是我灵光', '就格么简单，安逸'],
    error: ['坏特了，代码被我弄崩特了', '报错了呀？先勿要提交哦', '红彤彤一片，看得我心慌'],
    slow: ['慢吞吞格，我壳都要缩进去了', '转来转去，我茶都泡好几壶了'],
    idle: ['哈喽，还勒海澄清需求伐', '哈喽哈喽，人到哪里去了', '侬做啥呢，哪能勿响了', '闲着也是闲着，来白相白相', '是勿是又勒海摸鱼了'],
    latenight: ['半夜三更了呀，做生活是为了过日脚，可日脚勿单单是做生活呀', '死鬼，快点去困觉，再熬真变死鬼了', '格么晏了，这歇歇也只好自家疼自家了', '侬眼睛都熬红了呀，代码明朝再弄，先歇歇', '侬呀，身体要紧，勿要硬撑了，去困觉'],
  },
}

/** Cantonese fish (粤海鱼) — cool, easygoing little fish. */
const yuehai: Persona = {
  id: 'yuehai',
  nameKey: 'persona.yuehai.name',
  shape: 'fish',
  accent: '#0ea5e9',
  accent2: '#38bdf8',
  quips: {
    hello: ['嚟啦嚟啦，坐低先', '哟，好耐冇见喇', '今日咩风吹到你嚟'],
    thinking: ['唔使急，等我谂谂先', '你个脑筋，转得几快喎', '等阵，好快搞掂'],
    analyzing: ['等我睇睇呢堆代码先', '呢啲代码，够我消化一阵'],
    replied: ['搞掂喇，几好啦', '你睇，重系我叻', '咁简单，湿湿碎啦'],
    error: ['弊喇，代码俾我搞崩咗', '报错喇喎，唔好住提交住', '红晒一片，睇到都心慌'],
    slow: ['咁慢嘅，我条鱼都游几个圈喇', '转极都未得，我茶都饮咗几杯'],
    idle: ['喂，仲喺度澄清需求咩', '喂喂，人去咗边呀', '喂，做紧咩呀，做乜唔出声', '得闲冇事，倾两句啦', '系咪又摸紧鱼呀'],
    latenight: ['都三更半夜喇，做嘢系为咗生活，但系生活唔止得做嘢㗎', '死鬼，快啲去瞓喇，再熬真系变鬼㗎喇', '咁夜喇，呢阵时净系得自己锡自己咯', '你对眼都熬到红晒，代码听日再搞，早唞', '喂，身体紧要过一切，唔好死撑喇，去瞓啦'],
  },
}

/** Shaanxi ox (陕西牛) — sturdy, earnest, hard-working little ox. */
const shaanxi: Persona = {
  id: 'shaanxi',
  nameKey: 'persona.shaanxi.name',
  shape: 'ox',
  accent: '#a16207',
  accent2: '#ca8a04',
  quips: {
    hello:['来咧来咧，坐哈坐哈', '嘹咋咧，可算把你盼来咧', '啥风把你刮来咧'],
    thinking: ['甭急，我给你谝一哈', '你这脑子，咋就转不过来', '等一哈，马上就成咧'],
    analyzing: ['我给你翻一哈这达的代码', '这代码写的，够我看一阵咧'],
    replied: ['成咧成咧，弄好咧', '你看，还是我行么', '就这么简单，嘹得很'],
    error: ['坏咧，代码叫我弄崩咧', '报错咧，先甭忙提交撒', '红彤彤一片，看的人心慌'],
    slow: ['咋这么慢，我牛都耕完一亩地咧', '转半天咧，我茶都喝几碗咧'],
    idle: ['哈喽，还在弄需求么', '哈喽哈喽，人跑哪达咧', '你弄啥呢，咋不吭声咧', '闲着也是闲着，来谝两句', '是不是又在摸鱼撒'],
    latenight: ['都后半夜咧，干活是为咧过光景，可光景不光是干活撒', '死鬼，赶紧睡去，再熬真成死鬼咧', '这么晚咧，这会儿也就自个疼自个咧', '看你眼都熬红咧，代码明儿再弄，先歇哈', '娃，身子骨要紧，甭硬扛咧，睡去'],
  },
}

/** Robot (机器人) — calm, precise, faintly witty synthetic companion. */
const robot: Persona = {
  id: 'robot',
  nameKey: 'persona.robot.name',
  shape: 'robot',
  accent: '#64748b',
  accent2: '#38bdf8',
  quips: {
    hello: ['系统就绪，很高兴见到你', '你好，我已上线，随时待命', '检测到主人靠近，启动陪伴模式'],
    thinking: ['正在推演，请稍候', '让我调用一下逻辑单元', '数据加载中，马上给你结论'],
    analyzing: ['正在扫描这段代码……', '解析中，构建依赖关系图谱'],
    replied: ['任务完成，结果已输出', '搞定，效率百分之百', '处理完毕，还有别的指令吗'],
    error: ['检测到异常，报错信息已捕获', '出错了，建议先别提交', '警告:红色告警,需要人工介入'],
    slow: ['响应延迟偏高，正在等待上游', '带宽吃紧，请再给我几秒'],
    idle: ['你好,还在澄清需求吗', '空闲检测:主人是否还在', '待机中,需要我做点什么吗', '闲置太久,我先自检一下', '是否进入摸鱼模式了'],
    latenight: ['已过深夜,工作是为了生活,但生活不只是工作', '睡眠提醒:该关机休息了,否则明天效率会下降', '夜深了,这会儿只能自己照顾自己,早点睡', '检测到长时间加班,建议保存进度并休息', '主人,身体是硬件,硬件不能超频太久,去睡吧'],
  },
}

/** All personas indexed by id. */
export const PERSONAS: Readonly<Record<PersonaId, Persona>> = {
  dongbei,
  chuanyu,
  tianjin,
  shanghai,
  yuehai,
  shaanxi,
  robot,
}

/** Ordered persona list for the adoption / switch picker. */
export const PERSONA_LIST: readonly Persona[] = [dongbei, chuanyu, tianjin, shanghai, yuehai, shaanxi, robot]

/** Default persona for a fresh adoption. */
export const DEFAULT_PERSONA: PersonaId = 'dongbei'

/** Set of valid persona ids, for narrowing. */
const PERSONA_IDS: ReadonlySet<string> = new Set(PERSONA_LIST.map(p => p.id))

/** Narrow an unknown value into a valid persona id, falling back to default. */
export function asPersonaId(value: unknown): PersonaId {
  return typeof value === 'string' && PERSONA_IDS.has(value)
    ? (value as PersonaId)
    : DEFAULT_PERSONA
}

/** Pick a random quip for the given persona + scene. */
export function pickQuip(personaId: PersonaId, scene: Scene): string {
  const persona = PERSONAS[personaId] ?? PERSONAS[DEFAULT_PERSONA]
  const pool = persona.quips[scene]
  if (!pool || pool.length === 0) return ''
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx] ?? pool[0] ?? ''
}