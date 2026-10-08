import { expect, mock, test } from 'claude-code/testing'

const PROPS = { title: 'Agents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 30 }, view: {} }

const crabSource = async (ui: { drawn: () => Promise<unknown> }) => {
  const json = JSON.stringify(await ui.drawn())
  const m = json.match(/"source":"(<svg[^"]*?(?:\\"[^"]*?)*?<\/svg>)"/)
  return m?.[1]
}

test('a working crab changes frame as the clock moves', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.spawn', async () => ({ model: 'claude-opus-5-5', agentId: 'agent-1' }))
  on('command.register', async () => ({ value: {} }) as never)
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('session.start', async (_$, e) => ({ cwd: '.', ...(e as object) }) as never)
  await $.session.start({ cwd: '.', surface: 'desktop' } as never)
  await $.agent.spawn({
    prompt: 'x', description: 'Test the page', subagentType: 'general-purpose', tool_use_id: 't1',
    provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-opus-5-5', background: true, fork: false,
  } as never)
  const ui = await $.ui.mount({ plugin: 'agent-board', surface: 'desktop', component: 'Pane', requestId: 'agent-board', props: PROPS })
  const a = await crabSource(ui)
  await clock.advance(400)
  const b = await crabSource(ui)
  await clock.advance(400)
  const c = await crabSource(ui)
  expect(a).toBeDefined()
  expect(b).not.toBe(a)
  expect(c).toBe(a)
  await ui.unmount()
})
