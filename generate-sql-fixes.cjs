const XLSX = require('xlsx');
const fs = require('fs');

// Lade Excel-Daten
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

function escapeSQL(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
}

function findCorrectAnswerIndex(answers, correctText) {
  if (!correctText) return 1;
  
  // Exakte Übereinstimmung
  let index = answers.findIndex(a => a === correctText);
  if (index >= 0) return index + 1;
  
  // Flexiblere Suche (entferne Leerzeichen, Groß-/Kleinschreibung)
  const normalizedCorrect = correctText.toLowerCase().replace(/\s+/g, ' ').trim();
  index = answers.findIndex(a => {
    if (!a) return false;
    const normalized = String(a).toLowerCase().replace(/\s+/g, ' ').trim();
    return normalized === normalizedCorrect;
  });
  if (index >= 0) return index + 1;
  
  // Teilstring-Suche
  index = answers.findIndex(a => {
    if (!a) return false;
    return String(a).toLowerCase().includes(normalizedCorrect.substring(0, 20));
  });
  if (index >= 0) return index + 1;
  
  console.log(`Warnung: Korrekte Antwort nicht gefunden für "${correctText}" in [${answers.join(', ')}]`);
  return 1; // Fallback
}

let sqlStatements = [];
let successCount = 0;
let errorCount = 0;

console.log('Generiere SQL für alle 460 Fragen...');

// Bundesweite Fragen: Excel-Zeilen 2-301 (Array-Index 1-300) -> DB-IDs 1-300
for (let i = 1; i <= 300; i++) {
  const row = data[i];
  if (!row || !row[2]) {
    errorCount++;
    continue;
  }
  
  const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
  const correctAnswerText = row[8];
  
  if (answers.length < 4) {
    console.log(`Fehler: Zeile ${i+1} hat nur ${answers.length} Antworten`);
    errorCount++;
    continue;
  }
  
  const correctIndex = findCorrectAnswerIndex(answers, correctAnswerText);
  const escapedAnswers = answers.map(a => escapeSQL(a));
  const answersJson = `["${escapedAnswers.join('", "')}"]`;
  
  sqlStatements.push(`UPDATE questions SET answers = '${answersJson}'::jsonb, correct_answer = ${correctIndex} WHERE id = ${i};`);
  successCount++;
}

// Bundesländer-Fragen: Excel-Zeilen 302-461 (Array-Index 301-460) -> DB-IDs 301-460
for (let i = 301; i <= 460; i++) {
  const row = data[i];
  if (!row || !row[2]) {
    errorCount++;
    continue;
  }
  
  const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
  const correctAnswerText = row[8];
  
  if (answers.length < 4) {
    console.log(`Fehler: Zeile ${i+1} hat nur ${answers.length} Antworten`);
    errorCount++;
    continue;
  }
  
  const correctIndex = findCorrectAnswerIndex(answers, correctAnswerText);
  const escapedAnswers = answers.map(a => escapeSQL(a));
  const answersJson = `["${escapedAnswers.join('", "')}"]`;
  
  sqlStatements.push(`UPDATE questions SET answers = '${answersJson}'::jsonb, correct_answer = ${correctIndex} WHERE id = ${i};`);
  successCount++;
}

console.log(`\nGeneriert: ${successCount} SQL-Updates, ${errorCount} Fehler`);

// Teile in kleinere Batches auf (50 Statements pro Datei)
const batchSize = 50;
for (let i = 0; i < sqlStatements.length; i += batchSize) {
  const batch = sqlStatements.slice(i, i + batchSize);
  const batchNumber = Math.floor(i / batchSize) + 1;
  const filename = `sql-batch-${batchNumber.toString().padStart(2, '0')}.sql`;
  
  fs.writeFileSync(filename, batch.join('\n') + '\n');
  console.log(`Batch ${batchNumber}: ${filename} (${batch.length} Updates)`);
}

console.log(`\nAlle SQL-Batches erstellt. Insgesamt ${Math.ceil(sqlStatements.length / batchSize)} Dateien.`);