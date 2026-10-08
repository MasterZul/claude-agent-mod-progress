import { expect, mock, test } from 'claude-code/testing'

const PROPS = { title: 'Agents', isFocused: false, bodyColumns: 44, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 30 }, view: {} }

test('the board draws its stats and an empty state before any subagent', async ($, on) => {
  mock.clock(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'agent-board', surface, component: 'Pane', requestId: 'agent-board', props: PROPS })
    expect(await ui.find({ type: 'Text', text: /No subagents yet/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Tokens' })).toBeDefined()
    await ui.unmount()
  }
})
