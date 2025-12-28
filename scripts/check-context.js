import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const CORE_FILES = [
  'GEMINI.md',
  'AGENTS.md',
  'docs/status/current-work.md'
];

const MAX_TOKENS = 200000;
const OVERHEAD_ESTIMATE = 5000; // Conversation history, tool definitions, etc.

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(path.join(projectRoot, filePath));
    return stats.size;
  } catch (error) {
    // Intentionally silent or basic warn, file might not exist yet
    return 0;
  }
}

function drawProgressBar(current, max, width = 50) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  
  // Color codes
  const RESET = '\x1b[0m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  
  let color = GREEN;
  if (percentage > 0.8) cover = RED;
  else if (percentage > 0.6) color = YELLOW;
  
  // ASCII Bar
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${color}[${bar}] ${Math.round(percentage * 100)}%${RESET}`;
}

function main() {
  console.log('\n📊 \x1b[1mContext Budget Estimator\x1b[0m\n');

  let totalBytes = 0;
  
  console.log('Core Context Files:');
  CORE_FILES.forEach(file => {
    const size = getFileSize(file);
    totalBytes += size;
    // Pad for alignment
    const fileStr = `- ${file}`;
    const padding = ' '.repeat(Math.max(0, 40 - fileStr.length));
    console.log(`${fileStr}${padding}: ${(size / 1024).toFixed(2)} KB`);
  });

  const fileTokens = Math.ceil(totalBytes / 4);
  const totalTokens = fileTokens + OVERHEAD_ESTIMATE;
  const utilization = (totalTokens / MAX_TOKENS) * 100;

  console.log('\n----------------------------------------');
  console.log(`File Content Estimate: ${fileTokens.toLocaleString()} tokens`);
  console.log(`System Overhead (est): ${OVERHEAD_ESTIMATE.toLocaleString()} tokens`);
  console.log(`Total Usage (est):     ${totalTokens.toLocaleString()} / ${MAX_TOKENS.toLocaleString()} tokens`);
  console.log('----------------------------------------\n');

  console.log(drawProgressBar(totalTokens, MAX_TOKENS));
  
  if (utilization > 80) {
    console.log('\n\x1b[31m⚠️  CRITICAL: Context usage is high. Consider compacting history.\x1b[0m');
  } else if (utilization > 60) {
     console.log('\n\x1b[33m⚠️  WARNING: Context usage is moderate.\x1b[0m');
  } else {
    console.log('\n\x1b[32m✅ GOOD: Context usage is healthy.\x1b[0m');
  }
  console.log('\n');
}

main();
