# Install the two design skills (one time, before Phase 3)

Do this in Claude Code with this project folder open.

## 1. Anthropic frontend-design skill
Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design (Apache 2.0)

Option A, plugin (type these in Claude Code):
```
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```
frontend-design is expected to be in `example-skills`. If it isn't listed afterwards, use Option B.

Option B, copy just that skill into this project (in your terminal, from the project folder):
```
git clone --depth 1 https://github.com/anthropics/skills.git /tmp/anthropic-skills
mkdir -p .claude/skills
cp -r /tmp/anthropic-skills/skills/frontend-design .claude/skills/
```

## 2. UI UX Pro Max skill
Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT). Needs Python 3 (you already need it for the data pipeline).

With npm (in your terminal, from the project folder):
```
npm install -g ui-ux-pro-max-cli
uipro init --ai claude
```
This installs it into `.claude/skills/ui-ux-pro-max`.
No global install? Use `npx ui-ux-pro-max-cli init --ai claude` instead.

Note: in Claude Code this skill turns on by itself when you ask for UI work. The `/ui-ux-pro-max` slash command is for other tools, so just name the skill in your message (see START_HERE.md).

## 3. Check
Restart Claude Code in this folder and type `/skills`. You should see `frontend-design` and `ui-ux-pro-max`.
