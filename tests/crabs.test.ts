import { expect, test } from 'claude-code/testing'

import { crabSvg, roleOf } from '../hooks/crabs'

test('each agent gets the crab for its role', async () => {
  expect(roleOf('Write landing page styles', 'Frontend Developer')).toBe('designer')
  expect(roleOf('Design the launch graphics', 'general-purpose')).toBe('designer')
  expect(roleOf('Write landing page markup & copy', 'Frontend Developer')).toBe('developer')
  expect(roleOf('Build the API', 'Backend Architect')).toBe('developer')
  expect(roleOf('Research competitor launches', 'general-purpose')).toBe('researcher')
  expect(roleOf('Find the auth code', 'Explore')).toBe('researcher')
  expect(roleOf('Review the whole kit', 'general-purpose')).toBe('tester')
  expect(roleOf('Write tests for the parser', 'general-purpose')).toBe('tester')
})

test('every crab is a drawable svg', async () => {
  for (const role of ['designer', 'developer', 'researcher', 'tester'] as const) {
    const svg = crabSvg(role)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.length).toBeLessThan(131072)
  }
})
