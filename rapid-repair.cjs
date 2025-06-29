const XLSX = require('xlsx');
const { execSync } = require('child_process');
const fs = require('fs');

// Load Excel data
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Rapid repair: Generating SQL for ALL remaining questions...');

let allSqlCommands = [];
let processed = 0;

// Process all questions from 1-460
for (let i = 1; i <= 460; i++) {
  const row = data[i];
  if (!row || !row[2]) continue;
  
  const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
  const correctAnswerText = row[8];
  
  if (answers.length === 4 && correctAnswerText) {
    let correctIndex = answers.findIndex(a => a === correctAnswerText) + 1;
    
    // Better fallback matching
    if (correctIndex === 0) {
      const normalizedCorrect = String(correctAnswerText).toLowerCase().replace(/[^a-z0-9ü]/g, '');
      correctIndex = answers.findIndex(a => {
        const normalized = String(a).toLowerCase().replace(/[^a-z0-9ü]/g, '');
        return normalized.includes(normalizedCorrect.substring(0, Math.min(normalizedCorrect.length, 15)));
      }) + 1;
    }
    
    if (correctIndex === 0) correctIndex = 1;
    
    // Clean escape and create SQL
    const escapedAnswers = answers.map(a => String(a).replace(/'/g, "''").replace(/[\r\n]/g, ' '));
    const answersJson = '["' + escapedAnswers.join('", "') + '"]';
    
    allSqlCommands.push(`UPDATE questions SET answers = '${answersJson}'::jsonb, correct_answer = ${correctIndex} WHERE id = ${i};`);
    processed++;
  }
}

console.log(`Generated ${processed} SQL repair commands`);

// Write all SQL to one file
fs.writeFileSync('complete-repair.sql', allSqlCommands.join('\n') + '\n');

console.log('All SQL commands saved to complete-repair.sql');
console.log(`Total commands: ${allSqlCommands.length}`);