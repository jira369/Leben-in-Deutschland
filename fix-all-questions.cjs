const XLSX = require('xlsx');
const { Pool } = require('@neondatabase/serverless');

// Lade Excel-Daten
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Datenbankverbindung
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixAllQuestions() {
  console.log('Starte Reparatur aller 460 Fragen...');
  
  let fixed = 0;
  let errors = 0;

  // Bundesweite Fragen: Excel-Zeilen 2-301 (Array-Index 1-300) -> DB-IDs 1-300
  for (let i = 1; i <= 300; i++) {
    const row = data[i];
    if (!row) continue;
    
    try {
      const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
      const correctAnswerText = row[8];
      
      if (answers.length < 4) {
        console.log(`Warnung: Zeile ${i+1} hat nur ${answers.length} Antworten`);
        continue;
      }
      
      const correctIndex = answers.findIndex(a => a === correctAnswerText) + 1;
      if (correctIndex === 0) {
        console.log(`Warnung: Korrekte Antwort "${correctAnswerText}" nicht in Antworten gefunden für ID ${i}`);
        continue;
      }
      
      await pool.query(
        'UPDATE questions SET answers = $1, correct_answer = $2 WHERE id = $3',
        [JSON.stringify(answers), correctIndex, i]
      );
      
      fixed++;
      if (fixed % 50 === 0) console.log(`${fixed} Fragen repariert...`);
      
    } catch (error) {
      console.error(`Fehler bei ID ${i}:`, error.message);
      errors++;
    }
  }

  // Bundesländer-Fragen: Excel-Zeilen 302-461 (Array-Index 301-460) -> DB-IDs 301-460
  for (let i = 301; i <= 460; i++) {
    const row = data[i];
    if (!row) continue;
    
    try {
      const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
      const correctAnswerText = row[8];
      
      if (answers.length < 4) {
        console.log(`Warnung: Zeile ${i+1} hat nur ${answers.length} Antworten`);
        continue;
      }
      
      const correctIndex = answers.findIndex(a => a === correctAnswerText) + 1;
      if (correctIndex === 0) {
        console.log(`Warnung: Korrekte Antwort "${correctAnswerText}" nicht in Antworten gefunden für ID ${i}`);
        continue;
      }
      
      await pool.query(
        'UPDATE questions SET answers = $1, correct_answer = $2 WHERE id = $3',
        [JSON.stringify(answers), correctIndex, i]
      );
      
      fixed++;
      if (fixed % 50 === 0) console.log(`${fixed} Fragen repariert...`);
      
    } catch (error) {
      console.error(`Fehler bei ID ${i}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\nReparatur abgeschlossen:`);
  console.log(`✅ ${fixed} Fragen erfolgreich repariert`);
  console.log(`❌ ${errors} Fehler aufgetreten`);
  
  // Verifikation
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN jsonb_array_length(answers) = 4 THEN 1 END) as complete_answers,
      COUNT(CASE WHEN answers = '[]'::jsonb THEN 1 END) as empty_answers
    FROM questions
  `);
  
  console.log('\nVerifikation:');
  console.log(`Gesamtfragen: ${result.rows[0].total}`);
  console.log(`Vollständige Antworten (4): ${result.rows[0].complete_answers}`);
  console.log(`Leere Antworten: ${result.rows[0].empty_answers}`);
  
  await pool.end();
}

fixAllQuestions().catch(console.error);