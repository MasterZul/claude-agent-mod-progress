# agent-board

A Claude Code mod that opens an **Agents** pane showing every subagent as it works:

- Header stats: agents finished / total, tokens, elapsed time
- A card per agent, grouped into **Running** and **Finished**: task, role, agent type, model, current step or last tool, tokens, time and a progress bar
- A pixel-art crab per role that hops while its agent is working:
  - 🎨 **designer**: beret + paintbrush (design, style, CSS, UI…)
  - 💻 **developer**: cap + laptop (everything else)
  - 🔎 **researcher**: explorer hat + magnifier (research, find, analyse, plan…)
  - 🧪 **tester**: hard hat + check (test, review, verify, audit…)

The pane opens by itself when the first subagent starts, or with `/agents`. In the terminal the crabs are shown as emoji.

## Install

In a terminal Claude Code session:

```
/plugin install agent-board --marketplace MasterZul/claude-agent-mod-progress
```

Answer `y` to add the marketplace, then pick the **user** scope. It then loads in every session, including the desktop app's Code tab.

### Or run it from a local folder

Clone this repo and point Claude Code at it in `~/.claude/settings.json`:

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "/path/to/claude-agent-mod-progress" }
```

## Notes

- Progress bars show real steps when an agent keeps a todo list; otherwise they fill based on tool calls and complete when the agent finishes.
- Built against Claude Code 2.1.293's function-hooks plugin API (early access), so it may need updates on other versions.
- Crab sprites are text grids in `hooks/crabs.ts`, one letter per pixel; edit them to restyle or add roles.

## Develop

```
claude plugin validate .
claude plugin test .
```
