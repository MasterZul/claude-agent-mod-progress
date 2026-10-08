// Pixel-art crab avatars, one outfit per role, drawn as SVG on remote surfaces
export type Role = 'designer' | 'developer' | 'researcher' | 'tester'

export const ROLE_EMOJI: Record<Role, string> = {
  designer: '🎨',
  developer: '💻',
  researcher: '🔎',
  tester: '🧪',
}

// Most specific first: a "review the styles" task is a tester's, not a designer's
const RULES: [Role, RegExp][] = [
  ['tester', /test|qa\b|review|verify|check|audit|lint|debug|bug/i],
  ['researcher', /research|explore|investigat|search|find|analy|compare|competitor|plan|study/i],
  ['designer', /design|style|css|visual|graphic|brand|ux|ui\b|theme|layout|color|colour/i],
]

export const roleOf = (description: string, type: string): Role => {
  for (const [role, re] of RULES) if (re.test(description)) return role
  if (/explore|plan/i.test(type)) return 'researcher'
  for (const [role, re] of RULES) if (re.test(type)) return role
  return 'developer'
}

const PALETTE: Record<string, string> = {
  o: '#e8835a', // shell
  d: '#b85a3a', // claws & legs
  k: '#14141a', // eyes
  G: '#3fb27f', // developer cap
  g: '#2a8a5f',
  L: '#8a93a8', // laptop
  l: '#c9d3ea',
  P: '#9b6bd6', // designer beret
  b: '#8a5a2b', // brush handle
  R: '#ff6fa8', // paint
  K: '#d8c08a', // researcher helmet
  q: '#b39a62',
  s: '#7fb6ff', // magnifier
  Y: '#f2c230', // tester hard hat
  y: '#c99a12',
  c: '#47d16c', // check
}

const BODY = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '....oooooooo....',
  '...ookooookoo...',
  '...ookooookoo...',
  'dd.oooooooooo.dd',
  'dooooooooooooood',
  '...oooooooooo...',
  '...oooooooooo...',
  '...d.d....d.d...',
  '...d.d....d.d...',
]

const OUTFIT: Record<Role, string[]> = {
  developer: [
    '................',
    '................',
    '....GGGGGG......',
    '...GGGGGGGG.....',
    '...ggggggggggg..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........lllll.',
    '..........lllll.',
    '.........LLLLLLL',
  ],
  designer: [
    '................',
    '........P.......',
    '.....PPPPPP.....',
    '...PPPPPPPPPP..R',
    '....PPPPPPPP..RR',
    '..............b.',
    '..............b.',
    '..............b.',
  ],
  researcher: [
    '................',
    '......KKKK......',
    '.....KKKKKK.....',
    '....KKKKKKKK....',
    '..qqqqqqqqqqqq..',
    '.ss.............',
    's..s............',
    's..s............',
    '.ss.............',
  ],
  tester: [
    '................',
    '......YYYY......',
    '.....YYYYYY.....',
    '....YYYYYYYY....',
    '..yyyyyyyyyyyy..',
    '................',
    '................',
    '................',
    '................',
    '.........c......',
    '......c.c.......',
    '.......c........',
  ],
}

const SCALE = 3

// A working crab alternates two frames: frame 1 hops up a pixel with its claws raised one more
const isClaw = (x: number, y: number) => (y === 8 || y === 9) && (x <= 1 || x >= 14)

export const crabSvg = (role: Role, frame: 0 | 1 = 0): string => {
  const outfit = OUTFIT[role]
  const body: string[] = []
  const claws: string[] = []
  BODY.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const over = outfit[y]?.[x]
      const ch = over && over !== '.' ? over : row[x]
      const fill = ch ? PALETTE[ch] : undefined
      if (!fill) continue
      const rect = `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`
      ;(frame === 1 && isClaw(x, y) && !(over && over !== '.') ? claws : body).push(rect)
    }
  })
  const w = 16
  const h = BODY.length
  const inner =
    frame === 1
      ? `<g transform="translate(0 -1)">${body.join('')}<g transform="translate(0 -1)">${claws.join('')}</g></g>`
      : body.join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -2 ${w} ${h + 2}" width="${w * SCALE}" height="${(h + 2) * SCALE}" shape-rendering="crispEdges">${inner}</svg>`
}

export const CRAB_SIZE = { width: 16 * SCALE, height: (BODY.length + 2) * SCALE }
