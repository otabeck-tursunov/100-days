import type { Item, ItemKind, Section, Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  updatedAt: 0,
  startDate: '2026-10-25',
  theme: 'system',
  focusMinutes: 120,
  streakThreshold: 80,
  remindMorning: false,
  remindEvening: false,
  morningTime: '05:00',
  eveningTime: '21:30',
}

type Seed = [string, ItemKind?]

const MORNING: Seed[] = [
  ["05:00 da uyg'onish"],
  ['Bir stakan suv ichish'],
  ['Sovuq suv bilan yuvinish / tahorat'],
  ["5 daqiqa harakat (o'tirib-turish, cho'zilish)"],
  ['Kunni rejalashtirish (3 ta asosiy vazifa)', 'plan'],
  ["Full Stack (2 soat, chalg'imasdan)", 'focus'],
  ["Qog'oz kitob, 20+ sahifa", 'book'],
  ['Telegram post'],
  ["Najot Ta'lim: darslarga tayyorgarlik"],
]

const EVENING: Seed[] = [
  ["21:30 gacha kuryerlikni to'xtatish", 'courier'],
  ['Mutolaa 15 daqiqa'],
  ["Tongi navbatni to'liq bajardimmi?"],
  ["Bugun nima o'rgandim?", 'learned'],
  ['Nima xalaqit beryapti, qanday tuzataman?', 'obstacle'],
  ['Ertangi muhim vazifalar', 'tomorrow'],
  ['Kiyim, suv, noutbuk, kitob, daftarni tayyorlash'],
  ["Uyg'otgich 05:00 (05:05 zaxira)"],
  ['22:00 da uyqu'],
]

function build(list: Seed[], section: Section, prefix: string): Item[] {
  return list.map(([title, kind], i) => ({
    id: `${prefix}${i + 1}`,
    section,
    title,
    order: i,
    kind: kind ?? 'normal',
    updatedAt: 0,
    createdDay: '0000-00-00',
    archivedDay: null,
  }))
}

export const DEFAULT_ITEMS: Item[] = [
  ...build(MORNING, 'morning', 'm'),
  ...build(EVENING, 'evening', 'e'),
]
