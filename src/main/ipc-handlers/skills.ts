import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface Skill {
  id: string
  name: string
  description: string
  tags: string[]
  version: string
  author: string
  usageCount: number
  createdAt: string
  lastUsedAt: string
  content: string
  filePath: string
}

function getSkillsDir(): string {
  const dir = path.join(app.getPath('home'), '.apex', 'skills')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }

  const meta: Record<string, unknown> = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: unknown = line.slice(colonIdx + 1).trim()

    // Parse arrays
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      try {
        value = JSON.parse(value.replace(/'/g, '"'))
      } catch {
        value = []
      }
    }
    // Parse numbers
    if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
      value = Number(value)
    }
    meta[key] = value
  }

  return { meta, content: match[2] }
}

function serializeFrontmatter(meta: Record<string, unknown>, content: string): string {
  const lines = Object.entries(meta).map(([k, v]) => {
    if (Array.isArray(v)) {
      return `${k}: ${JSON.stringify(v)}`
    }
    return `${k}: ${v}`
  })
  return `---\n${lines.join('\n')}\n---\n${content}`
}

function fileToSkill(filePath: string): Skill | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { meta, content } = parseFrontmatter(raw)
    const id = path.basename(filePath, '.md')
    return {
      id,
      name: String(meta['name'] || id),
      description: String(meta['description'] || ''),
      tags: Array.isArray(meta['tags']) ? meta['tags'] as string[] : [],
      version: String(meta['version'] || '1.0.0'),
      author: String(meta['author'] || ''),
      usageCount: Number(meta['usageCount'] || 0),
      createdAt: String(meta['createdAt'] || new Date().toISOString()),
      lastUsedAt: String(meta['lastUsedAt'] || new Date().toISOString()),
      content,
      filePath,
    }
  } catch {
    return null
  }
}

export function registerSkillsHandlers(): void {
  ipcMain.handle('skills:list', async () => {
    const dir = getSkillsDir()
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
    const skills: Skill[] = []
    for (const file of files) {
      const skill = fileToSkill(path.join(dir, file))
      if (skill) skills.push(skill)
    }
    return skills.sort((a, b) => b.usageCount - a.usageCount)
  })

  ipcMain.handle('skills:get', async (_event, id: string) => {
    const dir = getSkillsDir()
    const filePath = path.join(dir, `${id}.md`)
    return fileToSkill(filePath)
  })

  ipcMain.handle('skills:save', async (_event, skill: Partial<Skill> & { name: string; content: string }) => {
    const dir = getSkillsDir()
    const id = skill.id || skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const filePath = path.join(dir, `${id}.md`)

    const meta: Record<string, unknown> = {
      name: skill.name,
      description: skill.description || '',
      tags: skill.tags || [],
      version: skill.version || '1.0.0',
      author: skill.author || '',
      usageCount: skill.usageCount || 0,
      createdAt: skill.createdAt || new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    }

    const raw = serializeFrontmatter(meta, skill.content)
    fs.writeFileSync(filePath, raw, 'utf-8')
    return { success: true, id, filePath }
  })

  ipcMain.handle('skills:delete', async (_event, id: string) => {
    const dir = getSkillsDir()
    const filePath = path.join(dir, `${id}.md`)
    try {
      fs.unlinkSync(filePath)
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('skills:increment-usage', async (_event, id: string) => {
    const dir = getSkillsDir()
    const filePath = path.join(dir, `${id}.md`)
    const skill = fileToSkill(filePath)
    if (!skill) return { success: false }

    const meta: Record<string, unknown> = {
      name: skill.name,
      description: skill.description,
      tags: skill.tags,
      version: skill.version,
      author: skill.author,
      usageCount: skill.usageCount + 1,
      createdAt: skill.createdAt,
      lastUsedAt: new Date().toISOString(),
    }

    const raw = serializeFrontmatter(meta, skill.content)
    fs.writeFileSync(filePath, raw, 'utf-8')
    return { success: true }
  })
}
