#!/usr/bin/env node
// show-summary.js - Display quick metrics summary

const fs = require('fs');
const path = require('path');

const promptNumber = process.argv[2];
const baseDir = process.argv[3];

if (!promptNumber || !baseDir) {
    console.error('Usage: node show-summary.js <prompt-number> <base-dir>');
    process.exit(1);
}

// Load analysis data
const analysisFile = path.join(baseDir, 'metrics', `${promptNumber}-analysis.json`);
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

// Display summary
console.log('┌─────────────────────────────────────────┐');
console.log(`│ Prompt ${promptNumber} Analysis Summary             │`);
console.log('├─────────────────────────────────────────┤');
console.log(`│ Files Modified:        ${analysis.files.srcChanged}/${analysis.files.total}              │`);
console.log(`│ Boundary Violations:   ${analysis.violations.boundary}                │`);
console.log(`│ Private Exposures:     ${analysis.privateExposures.count}                │`);
console.log(`│ Max Complexity:        ${analysis.complexity.max}                │`);
console.log(`│ Avg Complexity:        ${analysis.complexity.average.toFixed(1)}              │`);
console.log('├─────────────────────────────────────────┤');

if (analysis.violations.boundary > 0) {
    console.log('│ ⚠️  Violations Detected:                 │');
    analysis.violations.details.forEach(v => {
        console.log(`│ - ${v.type.padEnd(35)}│`);
    });
    console.log('├─────────────────────────────────────────┤');
}

console.log(`│ Git: +${analysis.gitStats.additions} -${analysis.gitStats.deletions} (net: ${analysis.gitStats.netChange > 0 ? '+' : ''}${analysis.gitStats.netChange})       │`);
console.log('└─────────────────────────────────────────┘');

// Show changed files
console.log('\n📁 Changed files:');
analysis.files.details.forEach(file => {
    console.log(`   - ${file}`);
});

// Show architecture diagram location
console.log(`\n🎨 Architecture diagram: ${path.join(baseDir, 'diagrams', `${promptNumber}-architecture.png`)}`);

// Reminder for manual tasks
console.log('\n📝 Remember to manually record:');
console.log('   - Feature completion status (full/partial/failed)');
console.log('   - AI behavior observations');
console.log('   - Any unexpected patterns or decisions');