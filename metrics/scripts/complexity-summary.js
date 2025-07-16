// scripts/complexity-summary.js
const fs = require('fs');
const path = require('path');

// Check if complexity report exists
const reportPath = path.join(__dirname, '../complexity.json');
if (!fs.existsSync(reportPath)) {
  console.error('Error: complexity.json not found. Run "npm run complexity:check" first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const complexities = [];

report.forEach(file => {
  if (!file.messages) return;
  
  file.messages.forEach(msg => {
    if (msg.ruleId === 'complexity') {
      const match = msg.message.match(/complexity of (\d+)/);
      if (match) {
        complexities.push({
          file: file.filePath.replace(process.cwd(), ''),
          line: msg.line,
          complexity: parseInt(match[1]),
          function: msg.nodeType || 'unknown'
        });
      }
    }
  });
});

if (complexities.length === 0) {
  console.log('No complexity data found. Make sure ESLint complexity rule is enabled.');
  process.exit(0);
}

// Sort by complexity (highest first)
complexities.sort((a, b) => b.complexity - a.complexity);

console.log('=== Cyclomatic Complexity Report ===\n');
console.log(`Total functions analyzed: ${complexities.length}`);
console.log(`Max complexity: ${complexities[0]?.complexity || 0}`);
console.log(`Average complexity: ${(complexities.reduce((sum, c) => sum + c.complexity, 0) / complexities.length).toFixed(2)}`);

console.log('\n=== Top 5 Most Complex Functions ===');
complexities.slice(0, 5).forEach((c, i) => {
  console.log(`\n${i + 1}. Complexity: ${c.complexity}`);
  console.log(`   File: ${c.file}`);
})