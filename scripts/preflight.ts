import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
// import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

// --- Configuration ---
const MAX_TOKENS = 200000
const OVERHEAD_ESTIMATE = 5000 // System prompt + basic definitions

// --- Helpers ---
function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(path.join(projectRoot, filePath))
    return stats.size
  } catch (_error) {
    return 0
  }
}

function readFileSafely(filePath: string): string {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf-8')
  } catch (_error) {
    return ''
  }
}

// --- Modules ---

// 1. Context Gauge
function getContextUsage() {
  const CORE_FILES = ['GEMINI.md', 'AGENTS.md', 'docs/status/current-work.md']
  let totalBytes = 0
  CORE_FILES.forEach((f) => (totalBytes += getFileSize(f)))

  const fileTokens = Math.ceil(totalBytes / 4)
  const totalTokens = fileTokens + OVERHEAD_ESTIMATE

  // Heuristic: Add 1000 tokens per file in 'active' context not listed here
  // (This is just a baseline check)

  const percentage = Math.round((totalTokens / MAX_TOKENS) * 100)

  return {
    totalTokens,
    percentage,
    status:
      percentage < 70
        ? '🟢 Healthy'
        : percentage < 85
          ? '🟡 Moderate'
          : '🔴 Critical',
  }
}

// 2. Status Summary
function getStatus() {
  const content = readFileSafely('docs/status/current-work.md')
  const lines = content.split('\n')

  let activeTask = 'Unknown'
  let deployment = 'Unknown'

  // Naive parsing
  for (const line of lines) {
    if (line.includes('Last Updated'))
      activeTask = line.replace('> **Last Updated**:', '').trim()
    if (line.includes('Deployment Status'))
      deployment = line.split('Deployment Status**:')[1].trim()
  }

  return { activeTask, deployment }
}

// 3. Skill Matcher (Naive)
function getRecommendedSkills(args: string[]) {
  // const skillIndex = readFileSafely('docs/SKILL_INDEX.md')
  const recommendations: string[] = []

  const keywords = {
    supabase: 'Supabase Skills',
    auth: 'Supabase Auth',
    db: 'Supabase Database',
    react: 'Vercel/React Best Practices',
    hook: 'Vercel/React Best Practices',
    design: 'Web Design Guidelines',
    css: 'Web Design Guidelines',
    context: 'Context Conservation',
  }

  const prompt = args.join(' ').toLowerCase()

  Object.entries(keywords).forEach(([key, skill]) => {
    if (prompt.includes(key) && !recommendations.includes(skill)) {
      recommendations.push(skill)
    }
  })

  return recommendations
}

// 4. Safety Check
function getSafetyStatus() {
  const isEnv = fs.existsSync(path.join(projectRoot, '.env'))
  return {
    env: isEnv ? '✅ Found' : '❌ Missing .env',
    mode: process.env.NODE_ENV || 'development',
  }
}

// --- Main ---

async function main() {
  console.log('\n✈️  \x1b[1mAGENT PREFLIGHT CHECK\x1b[0m')
  console.log('-------------------------')

  // Context
  const context = getContextUsage()
  console.log(
    `📊 Baseline Files: ${context.percentage}% (${context.totalTokens.toLocaleString()} tokens)`
  )
  console.log(
    `   \x1b[90m(Does not include current conversation history)\x1b[0m`
  )

  // Status
  const status = getStatus()
  console.log(`📌 Status: ${status.deployment}`)
  console.log(`   Task: ${status.activeTask}`)

  // Safety
  const safety = getSafetyStatus()
  console.log(`🛡️  Env: ${safety.env}`)

  // Skills
  const args = process.argv.slice(2)
  const skills = getRecommendedSkills(args)
  if (skills.length > 0) {
    console.log(`🧠 Recommended Skills:`)
    skills.forEach((s) => console.log(`   - ${s}`))
  }

  console.log('-------------------------')
  console.log(
    '✅ System Ready. \x1b[36mREMINDER: Update header with estimated Session History.\x1b[0m\n'
  )
}

main()
