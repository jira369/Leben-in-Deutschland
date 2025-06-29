const XLSX = require('xlsx');
const { Pool, neonConfig } = require('@neondatabase/serverless');

neonConfig.webSocketConstructor = require('ws');

async function correctImport() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Starting correct import of all 460 questions with proper answer mapping...');
    
    // Load Excel data
    const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let imported = 0;
    let errors = 0;

    // Process all questions: Excel rows 2-461 (Array index 1-460) -> DB IDs 1-460
    for (let i = 1; i <= 460; i++) {
      const row = data[i];
      if (!row || !row[2]) {
        console.log(`Skipping row ${i+1}: No question text`);
        continue;
      }
      
      const questionText = row[2];
      const answers = [row[4], row[5], row[6], row[7]].filter(a => a !== undefined && a !== null && a !== '');
      const correctAnswerText = row[8];
      
      if (answers.length < 4) {
        console.log(`Error: Row ${i+1} has only ${answers.length} answers`);
        errors++;
        continue;
      }
      
      // CRITICAL: Find exact correct answer index with proper matching
      let correctIndex = 1; // Default fallback
      
      if (correctAnswerText) {
        // 1. Try exact match first
        let foundIndex = answers.findIndex(a => String(a).trim() === String(correctAnswerText).trim());
        
        if (foundIndex >= 0) {
          correctIndex = foundIndex + 1;
        } else {
          // 2. Try normalized match (remove punctuation, normalize spaces)
          const normalizeText = (text) => String(text)
            .toLowerCase()
            .replace(/[.,!?;:\-\/()]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const normalizedCorrect = normalizeText(correctAnswerText);
          foundIndex = answers.findIndex(a => normalizeText(a) === normalizedCorrect);
          
          if (foundIndex >= 0) {
            correctIndex = foundIndex + 1;
          } else {
            // 3. Try partial match for longer texts
            foundIndex = answers.findIndex(a => {
              const normalizedA = normalizeText(a);
              const normalizedC = normalizeText(correctAnswerText);
              return normalizedA.includes(normalizedC.substring(0, Math.min(20, normalizedC.length))) ||
                     normalizedC.includes(normalizedA.substring(0, Math.min(20, normalizedA.length)));
            });
            
            if (foundIndex >= 0) {
              correctIndex = foundIndex + 1;
            } else {
              console.log(`WARNING: No match found for question ${i}`);
              console.log(`  Correct text: "${correctAnswerText}"`);
              console.log(`  Available answers: ${answers.map((a,idx) => `${idx+1}:"${a}"`).join(', ')}`);
            }
          }
        }
      }
      
      // Determine category based on Excel structure
      let category = 'Bundesweit';
      if (i >= 301) {
        // State questions (rows 302-461, IDs 301-460)
        const stateNames = [
          'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
          'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
          'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
          'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
        ];
        const stateIndex = Math.floor((i - 301) / 10);
        category = stateNames[stateIndex] || 'Unbekannt';
      }
      
      // Check for image questions (known patterns)
      const hasImage = questionText.includes('Wappen') || questionText.includes('Bundesland ist');
      let imagePath = null;
      if (hasImage && category !== 'Bundesweit') {
        if (questionText.includes('Wappen')) {
          imagePath = `Frage 301 ${category}.png`;
        } else if (questionText.includes('Bundesland ist')) {
          imagePath = `Frage 308 ${category}.png`;
        }
      } else if (hasImage && category === 'Bundesweit') {
        // Federal image questions (known IDs: 21, 55, 70, 130, 176, 181, 187)
        const imageQuestions = [21, 55, 70, 130, 176, 181, 187];
        if (imageQuestions.includes(i)) {
          imagePath = `Frage ${i}.png`;
        }
      }
      
      // Insert question with correct mapping
      try {
        await pool.query(`
          INSERT INTO questions (
            id, text, answers, correct_answer, explanation, category, 
            difficulty, has_image, image_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          i,
          questionText,
          JSON.stringify(answers),
          correctIndex,
          null,
          category,
          'medium',
          hasImage,
          imagePath
        ]);
        
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`Progress: ${imported} questions imported...`);
        }
        
      } catch (error) {
        console.error(`Error inserting question ${i}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\nImport completed:`);
    console.log(`✅ ${imported} questions imported successfully`);
    console.log(`❌ ${errors} errors occurred`);
    
    // Verification
    const result = await pool.query('SELECT COUNT(*) as total FROM questions');
    console.log(`\nDatabase verification: ${result.rows[0].total} questions in database`);
    
  } catch (error) {
    console.error('Import failed:', error.message);
  } finally {
    await pool.end();
  }
}

correctImport();