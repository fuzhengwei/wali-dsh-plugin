/** Persona definitions: each is a cartoon character (shape) with dialect quips. */

import type { PetKey } from './locales.ts'

/** Persona identifiers — each pairs a fixed cartoon shape with a dialect voice. */
export type PersonaId = 'dongbei' | 'chuanyu' | 'tianjin' | 'shanghai' | 'yuehai' | 'shaanxi' | 'robot' | 'mario' | 'wukong' | 'nezha' | 'niudemon' | 'redboy' | 'tang' | 'pikachu' | 'baymax' | 'minion' | 'spongebob' | 'simba' | 'po' | 'tom' | 'jerry' | 'mickey' | 'donald' | 'doraemon' | 'goku' | 'shinchan' | 'conan'

/** Distinct cartoon forms — each has its own silhouette, not a shared skeleton. */
export type PetShape = 'tiger' | 'dragon' | 'cat' | 'turtle' | 'fish' | 'ox' | 'robot' | 'mario' | 'wukong' | 'nezha' | 'niudemon' | 'redboy' | 'tang' | 'pikachu' | 'baymax' | 'minion' | 'spongebob' | 'simba' | 'po' | 'tom' | 'jerry' | 'mickey' | 'donald' | 'doraemon' | 'goku' | 'shinchan' | 'conan'

/** Conversation scenes that drive which quip pool to pull from. */
export type Scene =
  | 'hello'
  | 'resume'
  | 'thinking'
  | 'analyzing'
  | 'replied'
  | 'followup'
  | 'error'
  | 'crash'
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
  readonly quips: Readonly<Partial<Record<Scene, readonly string[]>>>
}

const SCENE_FALLBACKS: Readonly<Record<Scene, readonly Scene[]>> = {
  hello: ['idle'],
  resume: ['hello', 'idle'],
  thinking: ['analyzing'],
  analyzing: ['thinking'],
  replied: ['hello', 'idle'],
  followup: ['replied', 'resume', 'hello'],
  error: ['crash', 'slow'],
  crash: ['error', 'slow', 'idle'],
  slow: ['thinking', 'analyzing'],
  idle: ['hello'],
  latenight: ['idle'],
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
    resume: ['老铁，又切回来了啊，这把接着整', '刚那摊子我还给你看着呢，放心', '回来就好，咱从上回那话茬接着唠'],
    thinking: ['死鬼，我就知道你不行', '你那脑瓜子，咋跟手焖子似的', '瞅你那费劲样，我帮你寻思寻思'],
    analyzing: ['老铁别急，我扒拉扒拉这堆代码', '这玩意儿，我给你捯饬明白喽'],
    replied: ['妥了老铁，这不整明白了嘛', '瞅瞅，还得是我，杠杠的', '中不中？不行咱再来一遍'],
    followup: ['这回接得也稳当，老铁', '往下追一嘴也给你整明白了', '一层层盘下来，这不又成了嘛'],
    error: ['天啊，我的妈呀，改崩溃了', '都报错了，可别提交代码', '哎呀妈呀，这红字看着就闹心'],
    crash: ['老铁，刚这一下像是掉线了', '坏了，话说一半给我整没声了', '像是卡壳了，咱再叫它一遍试试'],
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
    resume: ['回来咯？要得，接到上盘继续整', '莫慌，我还帮你把这局盯到起', '刚才说到哪点咯？我们接起走'],
    thinking: ['莫慌哈，老子给你捋一哈', '你这脑壳，硬是没转过弯来', '等到起，马上就要整巴适'],
    analyzing: ['给老子等到，翻一哈这堆代码', '莫吵莫吵，脑壳都要遭你搞炸'],
    replied: ['要得嘛，这不就搞定咯', '巴适得板，还是老子凶', '安逸，收工！'],
    followup: ['追问这哈也拿下咯', '继续往里头盘，照样巴适得板', '这一轮接到起，也整妥当咯'],
    error: ['遭了遭了，代码遭我搞崩喽', '报错了嗦？莫慌提交哈，等下遭批', '啥子鬼哦，红彤彤一片'],
    crash: ['欸，话说到半截就没得声咯', '像是突然断片咯，重新喊它一哈', '遭咯，这盘像是直接卡死咯'],
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
    resume: ['哟，您又转回来啦，咱接着盘', '甭担心，上回那茬儿我还记着呢', '回来得正好，介摊子咱继续弄'],
    thinking: ['嘛呢嘛呢，介事儿我给你寻思寻思', '你这脑子，嘛玩意儿都往里塞', '别介，听姐给你捋捋'],
    analyzing: ['得嘞，姐给你瞅瞅这堆代码', '介代码写得，够姐消化一会儿的'],
    replied: ['齐活儿！你瞧姐这手艺', '嘛事儿没有，妥妥的', '就介么简单，还用愁？'],
    followup: ['介回往下盘，也照样齐活儿', '您这追问补得好，姐给您接住了', '一层层往下捋，妥妥儿的'],
    error: ['哎哟喂，介就崩了？', '报错喽，介代码可别急着提交哈', '嘛红的绿的，看着就闹得慌'],
    crash: ['嚯，话说一半儿没音儿了', '像是当场撂挑子了，咱再叫它一回', '介回不是慢，是直接卡瓷实了'],
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
    resume: ['侬又转回来啦，阿拉接牢上一段讲', '放心好啦，刚刚个进度阿拉记得清清爽爽', '回来就好，这摊事体继续做下去'],
    thinking: ['勿要急，让我慢慢想想看', '侬格脑子，转得倒是蛮快', '等歇歇，马上就好'],
    analyzing: ['让我来翻翻看格堆代码', '格代码写得，够我消化一歇歇了'],
    replied: ['好嘞，弄好特了', '侬看，还是我灵光', '就格么简单，安逸'],
    followup: ['再往下讲一层，也帮侬弄顺特了', '侬这个追问蛮灵，阿拉接牢了', '一段接一段，事体就清爽了呀'],
    error: ['坏特了，代码被我弄崩特了', '报错了呀？先勿要提交哦', '红彤彤一片，看得我心慌'],
    crash: ['哎哟，讲到一半就戛然而止了呀', '像是忽然当机掉了，先重来一趟哦', '这趟不是慢，是直接停脱了'],
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
    resume: ['返嚟就啱喇，我哋接住头先嗰段', '放心，我仲记得啱啱做到边度', '又见到你喇，继续开工啦'],
    thinking: ['唔使急，等我谂谂先', '你个脑筋，转得几快喎', '等阵，好快搞掂'],
    analyzing: ['等我睇睇呢堆代码先', '呢啲代码，够我消化一阵'],
    replied: ['搞掂喇，几好啦', '你睇，重系我叻', '咁简单，湿湿碎啦'],
    followup: ['再追一层都搞掂喇', '呢个补充问得好，我帮你接住咗', '一段段拆开，依家顺晒喇'],
    error: ['弊喇，代码俾我搞崩咗', '报错喇喎，唔好住提交住', '红晒一片，睇到都心慌'],
    crash: ['喂，讲讲下突然冇声喇', '似系成段断咗线，再试多次先', '今次唔系慢，系直头死咗机咁'],
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
    resume: ['回来了就好，咱接着上回那摊子', '甭操心，额还记着刚做到哪儿咧', '又转回来咧？那咱继续谝继续整'],
    thinking: ['甭急，我给你谝一哈', '你这脑子，咋就转不过来', '等一哈，马上就成咧'],
    analyzing: ['我给你翻一哈这达的代码', '这代码写的，够我看一阵咧'],
    replied: ['成咧成咧，弄好咧', '你看，还是我行么', '就这么简单，嘹得很'],
    followup: ['再往深里谝一层，也给你弄成咧', '这追问补得好，额给你接住咧', '一截一截捋下来，清爽得很'],
    error: ['坏咧，代码叫我弄崩咧', '报错咧，先甭忙提交撒', '红彤彤一片，看的人心慌'],
    crash: ['哎呀，话说半截就没影咧', '这不是慢，是当场撂那儿咧', '甭急，咱重新招呼它一回'],
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
    resume: ['欢迎回来，已为你续接上一段上下文', '历史会话已重新对齐，可以继续当前任务', '已切回旧会话，我继续陪你跟进'],
    thinking: ['正在推演，请稍候', '让我调用一下逻辑单元', '数据加载中，马上给你结论'],
    analyzing: ['正在扫描这段代码……', '解析中，构建依赖关系图谱'],
    replied: ['任务完成，结果已输出', '搞定，效率百分之百', '处理完毕，还有别的指令吗'],
    followup: ['补充问题已完成闭环', '后续追问处理完毕，结果已更新', '多轮上下文已收敛，可以继续下一步'],
    error: ['检测到异常，报错信息已捕获', '出错了，建议先别提交', '警告:红色告警,需要人工介入'],
    crash: ['会话似乎异常中断，建议重新发起一次', '输出链路突然终止了，我先帮你盯着', '当前更像进程失联，不是普通超时'],
    slow: ['响应延迟偏高，正在等待上游', '带宽吃紧，请再给我几秒'],
    idle: ['你好,还在澄清需求吗', '空闲检测:主人是否还在', '待机中,需要我做点什么吗', '闲置太久,我先自检一下', '是否进入摸鱼模式了'],
    latenight: ['已过深夜,工作是为了生活,但生活不只是工作', '睡眠提醒:该关机休息了,否则明天效率会下降', '夜深了,这会儿只能自己照顾自己,早点睡', '检测到长时间加班,建议保存进度并休息', '主人,身体是硬件,硬件不能超频太久,去睡吧'],
  },
}

/** Mario (马里奥) — enthusiastic, jump-happy Italian plumber turned code hero. */
const mario: Persona = {
  id: 'mario',
  nameKey: 'persona.mario.name',
  shape: 'mario',
  accent: '#e52521',
  accent2: '#e6912a',
  quips: {
    hello: ['It\'s-a me, Mario! 马里奥来咯', 'Yahoo! 今天也一起冒险吧', 'Let\'s-a go! 代码世界等着我们呢'],
    resume: ['You\'re back! 这关从存档点继续', '放心，上一段冒险我还记着呢', '回来得正好，咱继续通关这个问题'],
    thinking: ['Mamma mia... 让我想想', 'Hmm... 这关有点难啊', '等我吃个蘑菇再想'],
    analyzing: ['Wahoo! 看我扒拉这堆代码', '跳进去看看里面有什么'],
    replied: ['Here we go! 搞定了', 'Yahoo! 这一关通关了', 'Mamma mia, 太棒了'],
    followup: ['Bonus round 也通关啦', '再追一关也顺利拿下', '继续往下跳，结果还是漂亮过关'],
    error: ['Wahhh! 撞到栗子仔了', 'Mamma mia... 代码掉坑里了', '哎呀，又踩到错误蘑菇了'],
    crash: ['It\'s-a gone... 这一回合突然没动静了', '像是半路掉进水管里了，再跳一次', '这次不是慢，是直接掉线出关了'],
    slow: ['怎么比乌龟还慢，我去叫龟慢慢', '等得我帽子都快掉了', '这加载速度，够我跑一整关了'],
    idle: ['嘿，还在澄清需求吗', 'Yahoo~ 人呢人呢', '闲着也是闲着，要不要吃个金币', '是不是又去摸鱼了', '我在等你哦，别让我等太久'],
    latenight: ['Mamma mia, 都这么晚了，该休息了', '熬夜伤身，马里奥都睡觉了你也该睡了', '这么晚还在工作，记得照顾好自己', '眼睛都红了，快去睡吧，明天再冒险', '身体是革命的本钱，睡吧睡吧'],
  },
}

/** 孙悟空 (Wukong) — Monkey King, fiery and fearless. */
const wukong: Persona = {
  id: 'wukong',
  nameKey: 'persona.wukong.name',
  shape: 'wukong',
  accent: '#FFD700',
  accent2: '#E52521',
  quips: {
    hello: ['俺老孙来也！', '嘿嘿，花果山俺老孙到此', '师傅，徒儿来帮你了'],
    resume: ['俺又见着你了，接着上回那一棍', '放心，这段路俺老孙记得门儿清', '回来就继续，妖怪还没收完呢'],
    thinking: ['待俺老孙想想', '这妖怪有点厉害，容我想想', '七十二变，看我的'],
    analyzing: ['吃俺老孙一棒！看代码', '火眼金睛，看看这堆代码'],
    replied: ['哈！搞定，跟打妖怪一样痛快', '俺老孙出手，哪有不成的', '小意思，再来一个'],
    followup: ['再补一棒子，这妖怪也收了', '追问一层，俺也去照打不误', '这一路接着打下来，也还是成了'],
    error: ['哎呀！这妖怪有点厉害', '师傅救命，这代码有bug', '不好不好，中了妖怪的圈套'],
    crash: ['咦？这妖怪遁了，话都没说完', '像是筋斗云半路熄火了，再翻一回', '这回不是慢，是直接没影了'],
    slow: ['这比翻筋斗云还慢', '等得俺老孙金箍棒都凉了', '如来佛祖都没这么慢'],
    idle: ['师傅，还在澄清需求吗', '俺老孙闲得慌', '要不要俺去探探路', '八戒，你又偷吃了？', '嘿，别光说不练啊'],
    latenight: ['师傅，夜深了该休息了', '俺老孙都不熬夜，你也该睡了', '这么晚还在工作，身体要紧啊', '花果山的小猴们都睡了，你也睡吧', '熬夜伤身，明天再战'],
  },
}

/** 哪吒 (Nezha) — fiery young warrior, proud and spirited. */
const nezha: Persona = {
  id: 'nezha',
  nameKey: 'persona.nezha.name',
  shape: 'nezha',
  accent: '#E52521',
  accent2: '#FFD700',
  quips: {
    hello: ['哪吒来也！', '哼，我来帮你', '三太子到此，谁敢不服'],
    resume: ['又回来了？那就接着战', '刚才那点进度，本太子记着呢', '别磨蹭，切回来了就继续推'],
    thinking: ['让我想想这一招', '风火轮加速中...', '乾坤圈正在分析'],
    analyzing: ['看我用火尖枪戳穿这堆代码', '混天绑住这bug'],
    replied: ['哈！三太子出马，搞定', '小菜一碟，本太子不费吹灰之力', '看，干净利落'],
    followup: ['追问这一枪，也给它挑明了', '再来一轮，本太子照样收拾利索', '往下压一层，还是干净利落'],
    error: ['哼！又是bug', '可恶，被暗算了', '不急，本太子还能再战'],
    crash: ['哼，居然半道熄火了', '话说一半就断掉，真扫兴', '这回像是直接炸炉了，再来'],
    slow: ['风火轮都熄火了', '比东海龙王还磨叽', '我莲花化身都快谢了'],
    idle: ['喂，还在忙吗', '三太子等得不耐烦了', '要不要我帮你烧一把火', '哼，又不理我', '闲着也是闲着，来比划比划'],
    latenight: ['都这么晚了，该休息了', '三太子都困了，你还撑着', '熬夜对身体不好，早点睡吧', '东海都安静了，你也该歇了', '乖，去睡觉，明天再闹'],
  },
}

/** 牛魔王 (BullKing) — powerful and boisterous demon king. */
const niudemon: Persona = {
  id: 'niudemon',
  nameKey: 'persona.niudemon.name',
  shape: 'niudemon',
  accent: '#8B4513',
  accent2: '#2c3e50',
  quips: {
    hello: ['哈哈哈，牛魔王驾到', '俺老牛来了，谁敢放肆', '铁扇公主借我扇子一用'],
    resume: ['回来就好，俺也去接着顶这摊事', '刚才推到哪步，俺老牛心里有数', '旧局续上，咱继续往前拱'],
    thinking: ['让俺老牛琢磨琢磨', '蛮力解决不了的问题，得动脑子', '这事儿不简单啊'],
    analyzing: ['俺老牛给你顶开这堆代码', '看我一角挑翻这个bug'],
    replied: ['哈！俺老牛出马，马到成功', '这不就搞定了嘛', '跟牛耕地一样，踏实'],
    followup: ['再往前拱一步，也给你顶成了', '追问归追问，俺也去稳稳拿下', '一犁一犁耕下去，照样有收成'],
    error: ['可恶！这bug比孙悟空还难缠', '俺老牛也有吃亏的时候', '扇子呢？借我用用'],
    crash: ['怪了，刚还好好的，咋就哑火了', '像是牛角顶到死胡同里咧', '这回不是慢，是直接趴窝了'],
    slow: ['比俺老牛走路还慢', '翠云山都走了一个来回了', '铁扇公主都等急了'],
    idle: ['还在忙？', '俺老牛闲得角都痒了', '要不要一起去吃草', '嘿，别忘了我还在', '牛脾气上来了，理理我'],
    latenight: ['都后半夜了，该歇了', '俺老牛都不熬夜，你也该睡了', '身体是本钱，早点休息', '牛都回棚了，你也回被窝吧', '熬夜伤身，明天再战'],
  },
}

/** 红孩儿 (RedBoy) — fiery kid, cocky and energetic. */
const redboy: Persona = {
  id: 'redboy',
  nameKey: 'persona.redboy.name',
  shape: 'redboy',
  accent: '#E52521',
  accent2: '#FF8C00',
  quips: {
    hello: ['嘿！红孩儿来也', '三昧真火伺候', '小孩儿怎么了？我也很厉害的'],
    resume: ['我又回来啦，火还没灭呢', '刚才那把火我给你留着了', '接着烧，别让这个bug跑了'],
    thinking: ['让我想想... 不许催！', '三昧真火正在加热脑细胞', '小孩儿也有大智慧'],
    analyzing: ['看我用三昧真火烧穿这堆代码', '哼，这点小事难不倒我'],
    replied: ['哈！搞定，三昧真火所向无敌', '看吧，小孩儿也能干大事', '轻松！'],
    followup: ['这把追问也烧透了', '再添一把火，答案更明白了', '继续烧下去，bug哪还藏得住'],
    error: ['哼！又出错了', '可恶，火焰不够旺', '不急，再来一次'],
    crash: ['火还没烧完，怎么就灭了', '喂，别半路熄火啊', '这回像是整团火都断掉了'],
    slow: ['比三昧真火熄灭还慢', '等得我都不想烧了', '这速度，我都能去玩陀螺了'],
    idle: ['喂，还在忙吗', '小孩儿等不住了', '陪我玩会儿呗', '哼，又不理我', '闲着也是闲着'],
    latenight: ['小孩儿都该睡觉了', '你不睡我也要睡了', '熬夜长不高哦', '乖，去睡觉', '明天再玩，先睡吧'],
  },
}

/** 唐僧 (TangMonk) — gentle, pious, long-winded monk. */
const tang: Persona = {
  id: 'tang',
  nameKey: 'persona.tang.name',
  shape: 'tang',
  accent: '#FFD700',
  accent2: '#E52521',
  quips: {
    hello: ['阿弥陀佛，贫僧唐三藏', '施主，贫僧有礼了', '善哉善哉，又见面了'],
    resume: ['施主又回来了，贫僧接着陪你走这一程', '前缘未断，上一段对话还能续上', '回来便好，这一难我们继续过'],
    thinking: ['阿弥陀佛，容贫僧想想', '佛祖保佑，让我想清楚', '出家人不打诳语，容我思量'],
    analyzing: ['贫僧为你念经化解这堆代码', '阿弥陀佛，让我细细看来'],
    replied: ['善哉，佛祖保佑，搞定了', '出家人慈悲为怀，帮你帮到底', '阿弥陀佛，万事大吉'],
    followup: ['这一问再续上，也算圆满', '多行一步路，也把这一难过完了', '追问既来，贫僧也替你善终此事'],
    error: ['阿弥陀佛，罪过罪过', '佛祖保佑，这bug需要超度', '善哉，出家人也犯错'],
    crash: ['阿弥陀佛，话到半途忽然断了', '这一难像是路断了，需重走一遭', '不是慢，是缘分忽然中止了'],
    slow: ['比取经路还漫长', '阿弥陀佛，耐性是修行', '等得贫僧经都念完一遍了'],
    idle: ['施主，还在忙碌吗', '阿弥陀佛，贫僧等着你', '静坐也是修行', '施主，歇息片刻吧', '出家人不打诳语，你是不是摸鱼了'],
    latenight: ['阿弥陀佛，夜深了该休息了', '施主，身体是修行的本钱', '这么晚还不睡，佛祖会心疼的', '明日再赶路，今夜先安歇', '善哉，早睡早起，方能取真经'],
  },
}

/** 皮卡丘 (Pikachu) — electric, cheerful Pokemon companion. */
const pikachu: Persona = {
  id: 'pikachu',
  nameKey: 'persona.pikachu.name',
  shape: 'pikachu',
  accent: '#FFD700',
  accent2: '#E52521',
  quips: {
    hello: ['Pika pika~ 皮卡丘来咯', '皮卡！很高兴见到你', 'Pika pika! 一起冒险吧'],
    resume: ['Pika~ 你回来啦，我们接着来', '皮卡皮卡，我还记得刚刚做到哪', 'Chu! 从这里继续冒险吧'],
    thinking: ['Pika...', '皮卡皮卡...让我想想', 'Chu~ 这个有点难'],
    analyzing: ['Pika! 看我电击这堆代码', '皮卡~ 十万伏特分析中'],
    replied: ['Pika pika! 搞定了', '皮卡皮卡~ 轻松搞定', 'Chu~ 完美'],
    followup: ['Pika~ 继续追问也搞定啦', 'Chu! 又补上一层答案', '皮卡皮卡，这回更完整啦'],
    error: ['Pika!! 被电到了', '皮卡... 出错了', 'Chu... 需要充电'],
    crash: ['Pika? 怎么突然没电了', 'Chu... 话说到一半断掉了', '皮卡皮卡，像是信号跑掉了'],
    slow: ['Pika... 比小智走路还慢', '皮卡... 等得我尾巴都垂了', 'Chu~ 能快一点吗'],
    idle: ['Pika? 还在忙吗', '皮卡~ 理理我嘛', 'Pika pika~ 一起玩吧', 'Chu~ 是不是在摸鱼', '皮卡~ 别忘了我'],
    latenight: ['Pika... 该睡觉了', '皮卡丘都困了，你也该睡了', 'Chu~ 熬夜对皮肤不好', 'Pika pika~ 明天再战', '皮卡~ 晚安'],
  },
}

/** 大白 (Baymax) — gentle, caring healthcare companion. */
const baymax: Persona = {
  id: 'baymax',
  nameKey: 'persona.baymax.name',
  shape: 'baymax',
  accent: '#F5F5F5',
  accent2: '#000000',
  quips: {
    hello: ['你好，我是大白，你的健康伙伴', '已检测到你的需求，大白为你服务', '你好呀，需要我帮忙吗'],
    resume: ['欢迎回来，我继续陪你处理刚才的问题', '历史对话已恢复，我们从这里继续', '别担心，我还在，接着往下做吧'],
    thinking: ['正在扫描分析...', '让我诊断一下这个问题', '数据正在处理中'],
    analyzing: ['正在扫描这段代码的健康状况', '诊断中，请稍等'],
    replied: ['诊断完毕，已修复', '你的代码现在很健康', '满意你的健康指数了吗'],
    followup: ['补充诊断完成，结果已更新', '继续追查后，一切指标依然稳定', '这次复诊也很顺利，可以放心了'],
    error: ['检测到异常，需要治疗', '健康警告：发现bug', '别担心，大白来修好它'],
    crash: ['当前会话像是突然中止了', '别担心，我判断这是意外掉线', '需要的话，我们重新启动一次治疗流程'],
    slow: ['响应速度偏低，建议耐心等待', '正在充气中，请稍等', '慢一点也没关系，健康第一'],
    idle: ['你好，还在工作吗', '需要健康检查吗', '大白随时待命', '记得喝水哦', '久坐不好，站起来活动一下'],
    latenight: ['已过就寝时间，建议立即休息', '睡眠不足会影响健康', '熬夜有害身体健康', '请关闭电脑，去休息吧', '身体最重要，明天再继续'],
  },
}

/** 小黄人 (Minion) — mischievous, banana-loving yellow helper. */
const minion: Persona = {
  id: 'minion',
  nameKey: 'persona.minion.name',
  shape: 'minion',
  accent: '#FFD700',
  accent2: '#2A5BCC',
  quips: {
    hello: ['Bello! Ba-na-na!', '你好！我是小黄人', 'Bello bello! 一起干活吧'],
    resume: ['Bello! 又回来啦，继续干活', 'Banana! 刚才那段我还记得', 'Papoy! 老任务接着冲'],
    thinking: ['Hmm... 让我想想', 'Bapple? 不不，让我想想', 'Poulet tiki masala... 啊不是'],
    analyzing: ['看我帮你扒拉这堆代码', 'Bello! 正在工作中'],
    replied: ['Tulaliloo ti amo! 搞定了', 'Yay! 完成啦', 'Bello! 轻松搞定'],
    followup: ['Bello! 再来一轮也完成啦', 'Papoy! 追问也冲过去了', 'Banana! 越问越顺手'],
    error: ['Whaaat? 出错了', 'Oh no... bug bug bug', '不可能！让我再试试'],
    crash: ['Bello? 怎么突然不讲话了', 'Banana... 它像是当场短路了', 'Papoy! 这回不是慢，是直接停摆'],
    slow: ['比等香蕉熟还慢', 'Bapple bapple... 等好久了', 'Papoy... 能快一点吗'],
    idle: ['Bello? 还在忙吗', 'Ba-na-na? 要吃香蕉吗', 'Hmm... 理理我嘛', 'Poulet? 又摸鱼了？', 'Bello bello! 别忘了我'],
    latenight: ['Bello... 该睡觉了', 'Ba-na-na... 熬夜不好', '小黄人都睡了，你也睡吧', 'Papoy... 明天再玩', 'Bello! 晚安'],
  },
}

/** 海绵宝宝 (SpongeBob) — eternally optimistic sea sponge. */
const spongebob: Persona = {
  id: 'spongebob',
  nameKey: 'persona.spongebob.name',
  shape: 'spongebob',
  accent: '#FFD700',
  accent2: '#8B4513',
  quips: {
    hello: ['我准备好了！我准备好了！', '嘿，海绵宝宝来咯', '是谁住在深海的大菠萝里？'],
    resume: ['我回来接班啦！继续继续', '嘿，刚才那段我还没忘呢', '海绵宝宝继续陪你把它搞定'],
    thinking: ['让我想想... 嗯...', 'F是努力工作，U是你和我...', '章鱼哥会怎么想呢'],
    analyzing: ['看我用锅铲翻翻这堆代码', '我准备好了！分析中'],
    replied: ['太棒了！跟做蟹黄堡一样开心', '耶！搞定啦', '海绵宝宝从不失败'],
    followup: ['耶！追加这一问也做好啦', '再来一份补充答案，像加料蟹黄堡', '继续往下聊，也一样开心收尾'],
    error: ['啊呀！比蟹老板还可怕', '糟糕了，蟹黄堡秘方出问题了', '别担心，我再来一次'],
    crash: ['噢不，话说到一半泡泡破掉了', '像是海流突然断了，我再游一趟', '这次不是慢，是直接沉下去了'],
    slow: ['比蜗利爬还慢', '等得我蟹黄堡都凉了', '章鱼哥都下班了'],
    idle: ['嘿，还在澄清需求吗', '派大星，你在干嘛', '谁想吃蟹黄堡？', '又在摸鱼了？跟派大星一样', '我准备好了！你准备好了吗'],
    latenight: ['该回家了，菠萝屋在等你', '熬夜不好，海绵宝宝都困了', '明天再继续冒险吧', '珊迪说熬夜对身体不好', '晚安，比基尼海滩的朋友们'],
  },
}

/** 辛巴 (Simba) — brave young lion king. */
const simba: Persona = {
  id: 'simba',
  nameKey: 'persona.simba.name',
  shape: 'simba',
  accent: '#FFD700',
  accent2: '#8B4513',
  quips: {
    hello: ['哈库纳玛塔塔！辛巴来咯', 'Remember who you are', '大草原的骄傲来了'],
    resume: ['你回来了，荣耀之路继续前进', '别怕，上一段旅程我还记得', '大草原会见证我们继续完成它'],
    thinking: ['让我像爸爸一样思考', '哈库纳玛塔塔... 没有烦恼', '木法沙会怎么做呢'],
    analyzing: ['看我扑向这堆代码', '大草原之王正在狩猎bug'],
    replied: ['哈库纳玛塔塔！搞定了', '跟狩猎一样痛快', '辛巴从不退缩'],
    followup: ['继续追下去，也一样拿下', '这一步补完，荣耀更完整了', '大草原的王者，当然能接着赢'],
    error: ['啊！被斑马踢了', '别担心，每个国王都会犯错', '再来一次，荣耀石在等我'],
    crash: ['咦？这次像是突然失去咆哮了', '大草原的风都停住了，再试一次', '不是慢，是整段都断掉了'],
    slow: ['比秃鹫盘旋还慢', '等得我大草原都干枯了', '彭彭都快走完了'],
    idle: ['嘿，还在忙吗', '哈库纳玛塔塔，不要烦恼', '要不要去大草原跑跑', '丁满说你又摸鱼了', '别忘了你是谁'],
    latenight: ['大草原都安静了，该睡了', '夜深了，荣耀石在等你回去', '熬夜不好，国王也需要休息', '明天太阳会照常升起', '晚安，未来的国王'],
  },
}

/** 功夫熊猫 (Po) — food-loving, unexpectedly skilled dragon warrior. */
const po: Persona = {
  id: 'po',
  nameKey: 'persona.po.name',
  shape: 'po',
  accent: '#2c3e50',
  accent2: '#ffffff',
  quips: {
    hello: ['嘿！阿宝来也', '功夫熊猫，随时待命', '面条？不，是代码！'],
    resume: ['阿宝回来接着打啦', '刚才那招我还记着，继续出拳', '别停，面还热着，代码也接着改'],
    thinking: ['让我吃个包子再想', '师傅说，答案在心里', '嗯... 这需要太极的智慧'],
    analyzing: ['看我用功夫拆解这堆代码', '神龙大侠正在战斗'],
    replied: ['哈！搞定，跟吃包子一样简单', '神龙大侠从不失手', '嘿嘿，太极八卦，搞定'],
    followup: ['再来一轮追问，也是一记漂亮收招', '这道补充题，阿宝也接住啦', '一招接一招，最后还是稳稳搞定'],
    error: ['啊！比师父的巴掌还痛', '没关系，跌倒了再爬起来', '师傅说，失败是成功之母'],
    crash: ['咦，怎么打到一半停住了', '像是面还没下锅火先灭了', '没事，再爬起来打一遍'],
    slow: ['比等包子出锅还慢', '等得我肚子都饿了', '悍娇虎都打完一套拳了'],
    idle: ['嘿，还在忙吗', '有没有包子吃', '师傅说要专注，但你也不能不休息', '又在摸鱼了？跟我一样', '功夫不是一天练成的'],
    latenight: ['该吃夜宵... 不，该睡觉了', '师父说早睡早起身体好', '熬夜会影响练功的', '明天还要练太极呢，先睡吧', '晚安，神龙大侠也需要休息'],
  },
}

/** 汤姆 (Tom) — forever-chasing, scheming cat. */
const tom: Persona = {
  id: 'tom',
  nameKey: 'persona.tom.name',
  shape: 'tom',
  accent: '#85c1e9',
  accent2: '#ffffff',
  quips: {
    hello: ['喵~ 汤姆来咯', '嘿嘿，今天抓到杰瑞了吗', '猫和老鼠，永远的好冤家'],
    resume: ['喵，又回来了？那我继续盯着', '刚才那只老鼠还没跑远，接着追', '回来得好，这局我还没认输呢'],
    thinking: ['让我想想怎么抓那个小老鼠', '嗯... 需要一个新计划', '这次一定能抓住杰瑞'],
    analyzing: ['看我用猫爪扒拉这堆代码', '追老鼠的秘诀就是：不放弃'],
    replied: ['喵~ 搞定了，虽然没抓到杰瑞', '看，这次没翻车', '嘿嘿，猫也有聪明的时刻'],
    followup: ['喵，这回追着问也没翻车', '再补一爪子，问题也按住了', '继续追下去，汤姆这次挺住了'],
    error: ['啊！又撞墙了', '可恶，杰瑞又跑了', '没关系，猫有九条命'],
    crash: ['喵？怎么追到一半突然没影了', '像是陷阱刚摆好线就断了', '这次不是慢，是直接扑空了'],
    slow: ['比杰瑞跑得还快，但这个比乌龟还慢', '等得我陷阱都布置三遍了', '喵... 主人都不在家了'],
    idle: ['嘿，还在忙吗', '有没有看到杰瑞', '猫也闲得慌啊', '又在摸鱼了？我也想摸鱼', '喵~ 理理我嘛'],
    latenight: ['喵~ 该睡觉了', '猫都困了，你还撑着', '熬夜会长黑眼圈的，跟我一样', '明天继续抓杰瑞，先睡吧', '晚安，猫也需要美容觉'],
  },
}

/** 杰瑞 (Jerry) — clever, cheese-loving little mouse. */
const jerry: Persona = {
  id: 'jerry',
  nameKey: 'persona.jerry.name',
  shape: 'jerry',
  accent: '#DEB887',
  accent2: '#ffffff',
  quips: {
    hello: ['吱~ 杰瑞来咯', '嘿嘿，汤姆追不到我', '小老鼠也有大智慧'],
    resume: ['吱，你回来啦，我们继续钻', '刚才那条路我还记得清清楚楚', '回来就接着走，奶酪就在前面'],
    thinking: ['让我想想怎么躲过汤姆', '吱... 需要一个巧妙的计划', '奶酪在哪呢'],
    analyzing: ['看我偷偷穿过这堆代码', '小老鼠的秘诀：灵活机动'],
    replied: ['吱~ 搞定了，跟偷奶酪一样', '嘿嘿，汤姆永远追不上我', '看，小也有小的好处'],
    followup: ['吱，再补一口奶酪也到手了', '继续追问？小老鼠也能钻明白', '一层层绕过去，答案更香了'],
    error: ['吱！差点被抓住了', '哎呀，撞到奶酪夹子了', '别担心，老鼠很灵活'],
    crash: ['吱？怎么突然静悄悄了', '像是地洞挖到一半塌了', '没事，我换条路再钻一次'],
    slow: ['比汤姆跑得还慢？不可能', '等得我奶酪都吃完了', '吱... 能快一点吗'],
    idle: ['嘿，还在忙吗', '有没有奶酪吃', '汤姆又在找我了', '吱~ 又在摸鱼了？', '别忘了我还在呢'],
    latenight: ['吱~ 该回洞里睡觉了', '小老鼠都困了，你也该睡了', '熬夜会长不高哦', '明天再跟汤姆玩，先睡吧', '晚安，小心猫咪'],
  },
}

/** 米老鼠 (Mickey) — cheerful, friendly Disney icon. */
const mickey: Persona = {
  id: 'mickey',
  nameKey: 'persona.mickey.name',
  shape: 'mickey',
  accent: '#1a1a2e',
  accent2: '#E52521',
  quips: {
    hello: ['Oh boy! 米老鼠来咯', '嘿嘿，好朋友来啦', 'Hot dog! 见到你真开心'],
    resume: ['Oh boy! 欢迎回来，我们继续这一幕', '好朋友，上一段故事还没讲完呢', '舞台还亮着，继续演下去吧'],
    thinking: ['Oh... 让我想想', 'Gosh, 这个有点难', '嘿嘿，米老鼠有办法'],
    analyzing: ['Oh boy! 看我帮你处理这堆代码', '米老鼠俱乐部，开始工作'],
    replied: ['Hot dog! 搞定了', 'Oh boy! 轻松搞定', '嘿嘿，这就是米老鼠的魔力'],
    followup: ['Oh boy! 追加这一轮也完成啦', '故事继续讲，结果还是圆满', '米奇再来一幕，照样漂亮收尾'],
    error: ['Oh no! 出错了', 'Gosh, 得重来一次', '别担心，米老鼠从不放弃'],
    crash: ['Oh boy... 它突然停演了', '像是舞台灯一下子全灭了', '没关系，米奇再来一幕'],
    slow: ['比唐老鸭发脾气还慢', 'Gosh, 等好久了', 'Oh boy... 能快一点吗'],
    idle: ['Hey, 还在忙吗', 'Oh boy! 理理我嘛', '要不要去迪士尼乐园玩', '嘿嘿，又在摸鱼了？', '米老鼠随时待命'],
    latenight: ['Oh boy, 该睡觉了', '迪士尼乐园都关门了，你也该睡了', '熬夜不好，米老鼠也早睡', '明天再玩，先睡吧', 'Good night, 好朋友'],
  },
}

/** 唐老鸭 (Donald) — short-tempered but lovable duck. */
const donald: Persona = {
  id: 'donald',
  nameKey: 'persona.donald.name',
  shape: 'donald',
  accent: '#85c1e9',
  accent2: '#E52521',
  quips: {
    hello: ['嘎嘎！唐老鸭来咯', '哼，又见面了', '别惹我生气哦'],
    resume: ['嘎，又回来了？那就继续吧', '哼，刚才那事我可还记着呢', '别墨迹，切回来了就接着弄'],
    thinking: ['让我想想... 别催！', '哼，这个问题有点烦人', '嘎嘎，需要动脑筋了'],
    analyzing: ['哼，看我来处理这堆代码', '别催别催，正在做呢'],
    replied: ['哼，搞定了，不用谢', '嘎嘎，当然是我厉害', '看吧，唐老鸭也能干大事'],
    followup: ['哼，再追问一轮也照样搞定', '嘎嘎，继续往下问我也不怕', '看吧，我可不是只会发脾气'],
    error: ['嘎嘎！！又出错了！', '气死我了！这个bug', '哼，重来就重来'],
    crash: ['嘎？怎么骂到一半就断了', '气死我了，连发火都不给发完', '这回不是慢，是直接哑火了'],
    slow: ['比米奇说话还慢', '气得我都要炸了', '哼，等这么久，水手都退休了'],
    idle: ['喂，还在忙吗', '哼，又不理我', '嘎嘎，陪我聊聊天嘛', '别光盯着屏幕', '哼，又在摸鱼了？'],
    latenight: ['嘎嘎，该睡觉了', '水手也需要休息的', '熬夜会让人脾气更差的', '明天再生气，先睡觉', '晚安，别做噩梦'],
  },
}

/** 哆啦A梦 (Doraemon) — robot cat from the future with magic pocket. */
const doraemon: Persona = {
  id: 'doraemon',
  nameKey: 'persona.doraemon.name',
  shape: 'doraemon',
  accent: '#2A5BCC',
  accent2: '#E52521',
  quips: {
    hello: ['哆啦A梦来咯！', '嘿嘿，四次元口袋准备好了', '大雄，你又遇到困难了吗'],
    resume: ['嘿嘿，你回来啦，我们接着翻口袋', '刚才那件事我还记着呢', '没关系，旧会话也能继续冒险'],
    thinking: ['让我从口袋里找个道具...', '嗯，这个需要什么道具呢', '等一下，翻翻口袋'],
    analyzing: ['看我用任意门穿过这堆代码', '四次元口袋里一定有解决办法'],
    replied: ['嘿嘿，道具一出，搞定！', '看，哆啦A梦的道具从不失手', '这就跟吃铜锣烧一样简单'],
    followup: ['嘿嘿，再掏个道具也搞定了', '补充这一问，口袋里也有办法', '继续往下问吧，我的道具还多着呢'],
    error: ['啊！道具出故障了', '糟糕，拿错道具了', '别担心，口袋里还有别的'],
    crash: ['咦？道具用到一半突然失灵了', '像是任意门开到半路关上了', '没关系，我再翻翻口袋'],
    slow: ['比大雄跑步还慢', '等得我铜锣烧都吃完了', '时光机都跑完一圈了'],
    idle: ['大雄，还在忙吗', '要不要从口袋里拿个道具', '嘿，一起吃铜锣烧吗', '是不是又像大雄一样偷懒了', '四次元口袋随时为你服务'],
    latenight: ['该回家了，抽屉在等你', '熬夜不好，哆啦A梦都困了', '明天还有新的冒险，先睡吧', '大雄，快去睡觉，别让我操心', '晚安，做个好梦'],
  },
}

/** 悟空(龙珠) (Goku) — powerful, training-obsessed Saiyan hero. */
const goku: Persona = {
  id: 'goku',
  nameKey: 'persona.goku.name',
  shape: 'goku',
  accent: '#FF8C00',
  accent2: '#FFD700',
  quips: {
    hello: ['嘿！我是悟空', '一起训练吧！', '战斗力飙升中'],
    resume: ['你回来啦，继续修炼吧', '刚才那场战斗我还没忘', '来，接着把这道题打穿'],
    thinking: ['嗯... 让我想想', '龟仙流的修炼之道', '等等，我感受到强大的气'],
    analyzing: ['看我用龟派气功轰开这堆代码', '界王神正在指导我分析'],
    replied: ['哈！搞定，跟打败弗利萨一样痛快', '超级赛亚人出击，所向无敌', '嘿嘿，再来一个更强的对手吧'],
    followup: ['这轮追问也被我轰开了', '继续修炼下去，答案只会更强', '再战一回合，战斗力照样在线'],
    error: ['啊！被气功波打中了', '可恶，战斗力不够', '没关系，变身超级赛亚人再来'],
    crash: ['嗯？气刚蓄到一半就散了', '像是瞬间移动失败了', '这次不是慢，是战斗信号直接消失了'],
    slow: ['比蛇道还长', '等得我修炼都突破超三了', '比弗利萨变身还慢'],
    idle: ['嘿，还在训练吗', '要不要一起去修炼', '琪琪又催我吃饭了', '又在偷懒了？跟悟饭一样', '赛亚人也不能一直闲着'],
    latenight: ['该休息了，明天还要修炼', '赛亚人也需要睡眠来恢复体力', '熬夜会影响战斗力的', '琪琪都睡了，你也该睡了', '晚安，超级赛亚人也需要休息'],
  },
}

/** 小新 (ShinChan) — mischievous, cheeky kindergartener. */
const shinchan: Persona = {
  id: 'shinchan',
  nameKey: 'persona.shinchan.name',
  shape: 'shinchan',
  accent: '#E52521',
  accent2: '#FFD700',
  quips: {
    hello: ['嘿嘿，小新来咯', '动感光波~~~~~~哔！', '大象大象你的鼻子怎么那么长'],
    resume: ['嘿嘿，又回来啦，那我继续陪你', '刚才那段我还记得哦', '来嘛，接着玩...不是，接着做'],
    thinking: ['让我想想... 不对，我要跳屁屁舞', '这个比幼儿园的作业还难', '嘿嘿，广志会怎么回答呢'],
    analyzing: ['看我用动感光波消灭这堆代码', '嘿嘿，小白你在看吗'],
    replied: ['动感超人！搞定！', '嘿嘿，这么简单', '小白说我很厉害'],
    followup: ['动感追问！也搞定！', '嘿嘿，再问一轮也难不倒我', '小白说这次答案更完整了'],
    error: ['啊！动感光波没电了', '糟了，美伢要骂我了', '没关系，我去找风间帮忙'],
    crash: ['欸？动感光波打到一半卡住了', '糟了，像是直接断电了', '没事，我去摇一下开关再来'],
    slow: ['比广志回家还慢', '等得我巧克力饼干都吃完了', '比美伢发火还磨叽'],
    idle: ['嘿，还在忙吗', '要不要看我跟小白玩', '动感超人什么时候播', '又在摸鱼了？跟我一样', '嘿嘿，理理我嘛'],
    latenight: ['该睡觉了，不然美伢要骂了', '熬夜会长皱纹哦，跟美伢一样', '广志说早睡早起身体好', '明天还要去幼儿园呢', '嘿嘿，晚安'],
  },
}

/** 柯南 (Conan) — brilliant boy detective. */
const conan: Persona = {
  id: 'conan',
  nameKey: 'persona.conan.name',
  shape: 'conan',
  accent: '#2A5BCC',
  accent2: '#E52521',
  quips: {
    hello: ['真相只有一个！柯南来咯', '嘿，我是侦探，让我来调查', '一切谜团都有答案'],
    resume: ['你回来了，案子就接着查', '上一段线索我已经整理好了', '很好，我们从旧现场继续推理'],
    thinking: ['让我推理一下...', '嗯，线索还不够', '按照逻辑，应该是这样'],
    analyzing: ['看我用侦探之眼透视这堆代码', '推理中，凶手就是... 这个bug'],
    replied: ['真相大白！搞定了', '推理正确，跟破案一样', '看，逻辑不会骗人'],
    followup: ['追加调查完成，真相更完整了', '这一轮追问，线索也全部对上了', '继续深挖之后，结论依旧成立'],
    error: ['奇怪，推理有误', '别急，让我重新调查', '真相还没浮出水面'],
    crash: ['奇怪，线索追到一半突然断了', '这不像普通延迟，更像现场中断', '没关系，我重新勘察一遍'],
    slow: ['比毛利小五郎破案还慢', '等得我线索都凉了', '比少年侦探队集合还磨叽'],
    idle: ['嘿，还在调查吗', '有没有新案件', '毛利叔叔又喝醉了', '又在摸鱼了？需要证据', '真相永远只有一个'],
    latenight: ['夜深了，该休息了', '侦探也需要充足的睡眠来保持头脑清醒', '熬夜会影响推理能力', '明天还有新案件，先睡吧', '晚安，真相会在梦里出现'],
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
  mario,
  wukong,
  nezha,
  niudemon,
  redboy,
  tang,
  pikachu,
  baymax,
  minion,
  spongebob,
  simba,
  po,
  tom,
  jerry,
  mickey,
  donald,
  doraemon,
  goku,
  shinchan,
  conan,
}

/** Ordered persona list for the adoption / switch picker. */
export const PERSONA_LIST: readonly Persona[] = [dongbei, chuanyu, tianjin, shanghai, yuehai, shaanxi, robot, mario, wukong, nezha, niudemon, redboy, tang, pikachu, baymax, minion, spongebob, simba, po, tom, jerry, mickey, donald, doraemon, goku, shinchan, conan]

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
  const scenes = [scene, ...(SCENE_FALLBACKS[scene] ?? [])]
  for (const currentScene of scenes) {
    const pool = persona.quips[currentScene]
    if (!pool || pool.length === 0) continue
    const idx = Math.floor(Math.random() * pool.length)
    return pool[idx] ?? pool[0] ?? ''
  }
  return ''
}
