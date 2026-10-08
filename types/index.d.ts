export type AgentRow = {
  id: string
  description: string
  type: string
  model: string
  color: string
  startedAt: number
  endedAt?: number
  status: 'running' | 'done' | 'failed'
  tools: number
  lastTool?: string
  tokens: number
  todoDone?: number
  todoTotal?: number
  todoNow?: string
}

declare module 'claude-code' {
  interface PluginState {
    'agent-board': { agents: AgentRow[]; tick: number }
  }
}
