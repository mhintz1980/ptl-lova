/**
 * Deslop Script
 * Scans the codebase for "AI Slop" (debug statements, secrets, etc)
 * Usage: node scripts/deslop.js [path]
 */

import fs from 'fs'
import path from 'path'
import { getPatternsForLanguage, isFileExcluded } from './lib/slop-patterns.js'

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function getLanguageFromExtension(ext) {
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'javascript',
    tsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    rb: 'ruby',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
  }
  return map[ext.replace('.', '')] || null
}

async function scanFile(filePath) {
  const ext = path.extname(filePath)
  const language = getLanguageFromExtension(ext)

  // Default to universal patterns if language unknown
  const patterns = getPatternsForLanguage(language || 'universal')
  const issues = []

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    for (const [name, pattern] of Object.entries(patterns)) {
      // Check exclusions (e.g. *.test.ts)
      if (isFileExcluded(filePath, pattern.exclude)) continue

      // Skip if pattern is null (e.g. requires multi-pass)
      if (!pattern.pattern) continue

      lines.forEach((line, idx) => {
        if (pattern.pattern.test(line)) {
          // Check if line length is excessive (minified code)
          if (line.length > 500) return

          issues.push({
            file: filePath,
            line: idx + 1,
            type: name,
            severity: pattern.severity,
            description: pattern.description,
            content: line.trim(),
          })
        }
      })
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}: ${error.message}`)
  }

  return issues
}

async function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (
        [
          'node_modules',
          '.git',
          'dist',
          'build',
          '.gemini',
          'awesome-slash',
        ].includes(file)
      )
        continue
      await walk(filePath, fileList)
    } else {
      // Only scan source code files
      if (/\.(ts|tsx|js|jsx|py|rs|go)$/.test(file)) {
        fileList.push(filePath)
      }
    }
  }
  return fileList
}

async function main() {
  const targetDir = process.argv[2] || 'src' // Default to src
  const absoluteTarget = path.resolve(targetDir)

  // Check if target exists
  if (!fs.existsSync(absoluteTarget)) {
    console.error(`${COLORS.red}Error: Path not found: ${targetDir}${COLORS.reset}`)
    process.exit(1)
  }

  console.log(
    `${COLORS.cyan}Scanning ${targetDir} for slop...${COLORS.reset}\n`
  )

  let filesToScan = []
  if (fs.statSync(absoluteTarget).isDirectory()) {
    filesToScan = await walk(absoluteTarget)
  } else {
    filesToScan = [absoluteTarget]
  }

  let totalIssues = 0
  const issuesByFile = {}

  for (const file of filesToScan) {
    const issues = await scanFile(file)
    if (issues.length > 0) {
      issuesByFile[file] = issues
      totalIssues += issues.length
    }
  }

  // Report Findings
  if (totalIssues === 0) {
    console.log(`${COLORS.green}✨ No slop found! Great job.${COLORS.reset}`)
    return
  }

  console.log(
    `${COLORS.yellow}Found ${totalIssues} potential issues:${COLORS.reset}\n`
  )

  for (const [file, issues] of Object.entries(issuesByFile)) {
    const relPath = path.relative(process.cwd(), file)
    console.log(`${COLORS.cyan}${relPath}${COLORS.reset}`)

    issues.forEach((issue) => {
      const severityColor =
        issue.severity === 'critical'
          ? COLORS.red
          : issue.severity === 'high'
            ? COLORS.red
            : COLORS.yellow

      console.log(
        `  ${COLORS.gray}${issue.line}:${COLORS.reset} ${severityColor}[${issue.severity.toUpperCase()}] ${issue.type}${COLORS.reset}`
      )
      console.log(`    ${COLORS.gray}${issue.description}${COLORS.reset}`)
      console.log(
        `    ${COLORS.gray}"> ${issue.content.substring(0, 80)}${issue.content.length > 80 ? '...' : ''}"${COLORS.reset}\n`
      )
    })
  }

  // Exit with error if critical/high issues found
  const hasCritical = Object.values(issuesByFile)
    .flat()
    .some((i) => ['critical', 'high'].includes(i.severity))
  if (hasCritical) {
    console.log(
      `${COLORS.red}Critical or High severity issues found. Please fix them.${COLORS.reset}`
    )
    process.exit(1)
  }
}

main().catch(console.error)
