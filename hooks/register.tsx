import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRow } from '../types'
import { CRAB_SIZE, crabSvg, ROLE_EMOJI, roleOf } from './crabs'

const PANE = 'agent-board'
const COLORS = ['#3fb27f', '#4f8ef7', '#e0952f', '#b07cf0', '#e05f7a', '#2fb8c8']

const agents = atom({ plugin: 'agent-board', key: 'agents' } as const, [] as AgentRow[])
const tick = atom({ plugin: 'agent-board', key: 'tick' } as const, 0)

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const fmtTokens = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)
const shortModel = (m: string) =>
  m.replace(/^claude-/, '').replace(/-(\d+)-(\d+).*$/, ' $1.$2').replace(/^\w/, c => c.toUpperCase())

const progressOf = (a: AgentRow) => {
  if (a.status !== 'running') return 1
  if (a.todoTotal) return (a.todoDone ?? 0) / a.todoTotal
  return Math.min(0.9, a.tools / (a.tools + 8))
}

const patch = ($: EngineInterface, id: string, fn: (a: AgentRow) => AgentRow) =>
  update($, agents, list => list.map(a => (a.id === id ? fn(a) : a)))

let timer: { cancel: () => void } | undefined

// Drives the crabs' two-frame hop and the live clocks; restarted from each spawn so a timer
// lost to a failed hook or a reload never leaves the board frozen
const restartTicker = ($: EngineInterface) => {
  timer?.cancel()
  timer = $.clock.every(400, () => {
    void (async () => {
      try {
        const list = await read($, agents)
        if (list.some(a => a.status === 'running')) await update($, tick, t => t + 1)
      } catch {
        // one missed frame is harmless
      }
    })()
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    restartTicker($)
    try {
      await $.command.register({ name: 'agents', description: 'Show the live subagent progress board' })
    } catch {
      // already registered by an earlier load of this mod
    }
    return next(e)
  })

  on('command.run', { command: 'agents' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Agents' })
    return { text: 'Agents board opened.' }
  })

  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    if (!r.agentId) return r
    const id = r.agentId
    const startedAt = await $.clock.now()
    await update($, agents, list => [
      ...list,
      {
        id,
        description: e.description || e.subagentType,
        type: e.subagentType,
        model: r.model,
        color: COLORS[list.length % COLORS.length] ?? '#3fb27f',
        startedAt,
        status: 'running' as const,
        tools: 0,
        tokens: 0,
      },
    ])
    restartTicker($)
    void $.ui.open({ id: PANE, title: 'Agents' })
    return r
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId) {
      const input = (e as { input?: { todos?: { status?: string; content?: string }[] } }).input
      const todos = Array.isArray(input?.todos) ? input!.todos! : undefined
      await patch($, e.agentId, a => ({
        ...a,
        tools: a.tools + 1,
        lastTool: e.tool,
        ...(todos
          ? {
              todoTotal: todos.length,
              todoDone: todos.filter(t => t.status === 'completed').length,
              todoNow: todos.find(t => t.status === 'in_progress')?.content,
            }
          : {}),
      }))
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (e.agentId && r.usage) {
      const u = r.usage
      const n = u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
      await patch($, e.agentId, a => ({ ...a, tokens: a.tokens + n, model: u.model || a.model }))
    }
    return r
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      const endedAt = await $.clock.now()
      const failed = e.reason === 'error' || e.isAborted
      await patch($, e.agentId, a => ({ ...a, endedAt, status: failed ? 'failed' : 'done' }))
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const Svg = 'Svg' in ui ? ui.Svg : undefined
    const list = await read($, agents)
    const frame = ((await read($, tick)) % 2) as 0 | 1
    const now = await $.clock.now()
    const width = Math.max(20, (e.props.bodyColumns ?? 44) - 2)

    const running = list.filter(a => a.status === 'running')
    const finished = list.filter(a => a.status !== 'running')
    const totalTokens = list.reduce((s, a) => s + a.tokens, 0)
    const first = Math.min(...list.map(a => a.startedAt))
    const last = running.length ? now : Math.max(...list.map(a => a.endedAt ?? now))
    const elapsed = list.length ? last - first : 0

    const Stat = ({ label, value }: { label: string; value: string }) => (
      <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1} flexGrow={1}>
        <Text dimColor>{label}</Text>
        <Text bold>{value}</Text>
      </Box>
    )

    const Row = ({ a }: { a: AgentRow }) => {
      const p = progressOf(a)
      // Block glyphs draw wider than a cell outside the terminal; leave room so the bar stays on one line
      const barW = Math.max(10, e.surface === 'terminal' ? width - 2 : Math.floor(width * 0.6))
      const filled = Math.round(p * barW)
      const time = fmtTime((a.endedAt ?? now) - a.startedAt)
      const step = a.todoTotal
        ? `${a.todoDone ?? 0}/${a.todoTotal}${a.todoNow ? ` · ${a.todoNow}` : ''}`
        : a.status === 'running'
          ? `${a.tools} tools${a.lastTool ? ` · ${a.lastTool}` : ''}`
          : `${a.tools} tools`
      const mark = a.status === 'running' ? '●' : a.status === 'done' ? '✓' : '✗'
      const markColor = a.status === 'failed' ? '#e05f7a' : a.status === 'done' ? '#3fb27f' : a.color
      const role = roleOf(a.description, a.type)
      return (
        <Box key={a.id} marginBottom={1} gap={1}>
          <Box flexShrink={0} alignItems="center">
            {Svg ? (
              <Svg source={crabSvg(role, a.status === 'running' ? frame : 0)} alt={`${role} crab`} width={CRAB_SIZE.width} height={CRAB_SIZE.height} />
            ) : (
              <Text>{ROLE_EMOJI[role]}</Text>
            )}
          </Box>
          <Box flexDirection="column" flexGrow={1}>
          <Box justifyContent="space-between">
            <Text bold wrap="truncate-end">{a.description}</Text>
            <Text color={markColor}>{mark}</Text>
          </Box>
          <Text wrap="truncate-end">
            <Text color={a.color}>{role}</Text>
            <Text dimColor> · {a.type}</Text>
            <Text dimColor> · {shortModel(a.model)}</Text>
          </Text>
          <Box justifyContent="space-between">
            <Text dimColor wrap="truncate-end">{step}</Text>
            <Text dimColor>{fmtTokens(a.tokens)} · {time}</Text>
          </Box>
          <Text>
            <Text color={a.color}>{'█'.repeat(filled)}</Text>
            <Text dimColor>{'░'.repeat(barW - filled)}</Text>
          </Text>
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Stat label="Agents" value={`${finished.length}/${list.length}`} />
          <Stat label="Tokens" value={fmtTokens(totalTokens)} />
          <Stat label="Time" value={fmtTime(elapsed)} />
        </Box>
        {list.length === 0 && <Text dimColor>No subagents yet. They'll show up here when spawned.</Text>}
        {running.length > 0 && <Text dimColor>Running · {running.length}</Text>}
        {running.map(a => <Row a={a} />)}
        {finished.length > 0 && <Text dimColor>Finished · {finished.length}</Text>}
        {finished.map(a => <Row a={a} />)}
      </Box>
    )
  })
}
