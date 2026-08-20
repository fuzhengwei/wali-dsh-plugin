/** Festival greetings: date-driven blessings shown regardless of persona dialect. */

/** Known festival identifiers. */
export type FestivalId =
  | 'newyear'
  | 'valentines'
  | 'labor'
  | 'national'
  | 'christmas'
  | 'springfestival'
  | 'qixi'
| 'midautumn'

/** A festival: how to match its date, plus a pool of blessings to show. */
interface Festival {
  readonly id: FestivalId
  /** Display label (Chinese) for the festival. */
  readonly label: string
  /** Blessing quips; one is picked at random. */
  readonly greetings: readonly string[]
}

/** Gregorian (solar) festivals matched by fixed month/day. */
const SOLAR_FESTIVALS: ReadonlyArray<{ month: number; day: number; festival: Festival }> = [
  {
    month: 1,
    day: 1,
    festival: {
      id: 'newyear',
      label: '元旦',
      greetings: [
        '新年好呀！新的一年，愿你 bug 越来越少，头发越来越多～',
        '元旦快乐！翻篇儿了，新的一年一切都会好起来的',
        '新年第一天，先许个愿吧，我帮你记着',
      ],
    },
  },
  {
    month: 2,
    day: 14,
    festival: {
      id: 'valentines',
      label: '情人节',
      greetings: [
        '情人节快乐！有人陪固然好，没人陪也别忘了好好爱自己',
        '今天是情人节哦，别光顾着敲代码，去抱抱心爱的人吧',
        '情人节到啦，愿你被爱，也有能力去爱',
      ],
    },
  },
  {
    month: 5,
    day: 1,
    festival: {
      id: 'labor',
      label: '劳动节',
      greetings: [
        '劳动节快乐！辛苦啦打工人，今天可得好好歇歇',
        '五一到咯，劳动最光荣，但也别忘了给自己放个假',
        '劳动节了还在干活？你可真是劳模本模',
      ],
    },
  },
  {
    month: 10,
    day: 1,
    festival: {
      id: 'national',
      label: '国庆节',
      greetings: [
        '国庆快乐！祖国生日，也祝你假期开开心心',
        '普天同庆的日子，愿你也和这盛世一样，越来越好',
  '国庆七天乐，可别把假期都还给代码了哦',
      ],
    },
  },
  {
    month: 12,
    day: 25,
    festival: {
      id: 'christmas',
      label: '圣诞节',
      greetings: [
        '圣诞快乐！愿你的袜子里塞满惊喜，不是塞满 bug',
        'Merry Christmas！今晚早点关电脑，去看看圣诞树吧',
        '圣诞到啦，愿你被温暖和好运包围',
      ],
    },
  },
]

/**
 * Lunar festivals mapped to their Gregorian dates per year (hand-maintained).
 * Keyed by `YYYY-MM-DD` (solar). Extend this table each year as needed.
 */
const LUNAR_FESTIVALS: Readonly<Record<string, Festival>> = {
  // Spring Festival (正月初一)
  '2026-02-17': springFestival(),
  '2027-02-06': springFestival(),
  '2028-01-26': springFestival(),
  // Qixi (七月初七)
  '2026-08-19': qixi(),
  '2027-08-08': qixi(),
  '2028-08-26': qixi(),
  // Mid-Autumn (八月十五)
  '2026-09-25': midAutumn(),
  '2027-09-15': midAutumn(),
  '2028-10-03': midAutumn(),
}

function springFestival(): Festival {
  return {
    id: 'springfestival',
    label: '春节',
    greetings: [
      '过年好呀！新春大吉，愿你新的一年顺顺利利、红红火火',
      '春节到咯！愿你事事如意，代码一次通过，红包接到手软',
      '新年快乐！忙了一年，回家好好陪陪家人吧',
    ],
  }
}

function qixi(): Festival {
  return {
    id: 'qixi',
    label: '七夕',
    greetings: [
      '七夕快乐！愿有情人终成眷属，也愿你被这世界温柔以待',
      '今天是七夕哦，牛郎织女都相会了，你也别一个人闷着敲代码呀',
      '七夕到啦，愿你的浪漫不缺席',
    ],
  }
}

function midAutumn(): Festival {
  return {
    id: 'midautumn',
    label: '中秋',
    greetings: [
      '中秋快乐！月圆人团圆，愿你和牵挂的人都在一起',
      '中秋到咯，抬头看看月亮吧，别老盯着屏幕',
      '花好月圆，祝你和家人平安喜乐',
    ],
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Resolve the festival active on the given date, if any. */
export function currentFestival(date: Date = new Date()): Festival | null {
  const month = date.getMonth() + 1
  const day = date.getDate()
  for (const entry of SOLAR_FESTIVALS) {
    if (entry.month === month && entry.day === day) return entry.festival
  }
  const key = `${date.getFullYear()}-${pad2(month)}-${pad2(day)}`
  return LUNAR_FESTIVALS[key] ?? null
}

/** Pick a random blessing for the festival active on the given date, else ''. */
export function pickFestivalGreeting(date: Date = new Date()): string {
  const festival = currentFestival(date)
  if (!festival) return ''
  const pool = festival.greetings
  if (pool.length === 0) return ''
  return pool[Math.floor(Math.random() * pool.length)] ?? ''
}