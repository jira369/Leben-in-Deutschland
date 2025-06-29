const XLSX = require('xlsx');
const { Pool, neonConfig } = require('@neondatabase/serverless');

neonConfig.webSocketConstructor = require('ws');

async function continueImport() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Continuing import from question 157...');
    
    // Load Excel data
    const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let imported = 0;
    let errors = 0;

    // Continue from question 157 to 460
    for (let i = 157; i <= 460; i++) {
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
      
      // Enhanced answer matching with better normalization
      let correctIndex = 1;
      
      if (correctAnswerText) {
        // Function to normalize text for better matching
        const normalize = (text) => String(text)
          .toLowerCase()
          .replace(/[.,!?;:\-\/()]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .trim();
        
        const normalizedCorrect = normalize(correctAnswerText);
        
        // Try to find exact match in normalized form
        let foundIndex = answers.findIndex(a => normalize(a) === normalizedCorrect);
        
        if (foundIndex >= 0) {
          correctIndex = foundIndex + 1;
        } else {
          // Fallback: find best partial match
          let bestMatch = 0;
          let bestScore = 0;
          
          answers.forEach((answer, idx) => {
            const normalizedAnswer = normalize(answer);
            const shorter = normalizedAnswer.length < normalizedCorrect.length ? normalizedAnswer : normalizedCorrect;
            const longer = normalizedAnswer.length >= normalizedCorrect.length ? normalizedAnswer : normalizedCorrect;
            
            if (longer.includes(shorter) && shorter.length > 5) {
              const score = shorter.length / longer.length;
              if (score > bestScore) {
                bestScore = score;
                bestMatch = idx + 1;
              }
            }
          });
          
          if (bestMatch > 0) {
            correctIndex = bestMatch;
          } else {
            console.log(`No match for Q${i}: "${correctAnswerText}" in [${answers.join('; ')}]`);
          }
        }
      }
      
      // Determine category
      let category = 'Bundesweit';
      if (i >= 301) {
        const stateNames = [
          'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
          'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
          'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
          'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
        ];
        const stateIndex = Math.floor((i - 301) / 10);
        category = stateNames[stateIndex] || 'Unbekannt';
      }
      
      // Check for image questions
      const hasImage = questionText.includes('Wappen') || questionText.includes('Bundesland ist');
      let imagePath = null;
      if (hasImage && category !== 'Bundesweit') {
        if (questionText.includes('Wappen')) {
          imagePath = `Frage 301 ${category}.png`;
        } else if (questionText.includes('Bundesland ist')) {
          imagePath = `Frage 308 ${category}.png`;
        }
      }
      
      // Insert with UPSERT to handle duplicates
      try {
        await pool.query(`
          INSERT INTO questions (
            id, text, answers, correct_answer, explanation, category, 
            difficulty, has_image, image_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            answers = EXCLUDED.answers,
            correct_answer = EXCLUDED.correct_answer,
            category = EXCLUDED.category,
            has_image = EXCLUDED.has_image,
            image_path = EXCLUDED.image_path
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
        
        if (imported % 25 === 0) {
          console.log(`Progress: ${imported} additional questions imported...`);
        }
        
      } catch (error) {
        console.error(`Error with question ${i}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\nContinuation completed:`);
    console.log(`✅ ${imported} additional questions imported`);
    console.log(`❌ ${errors} errors occurred`);
    
    // Final verification
    const result = await pool.query('SELECT COUNT(*) as total FROM questions');
    console.log(`\nFinal count: ${result.rows[0].total} questions in database`);
    
  } catch (error) {
    console.error('Import continuation failed:', error.message);
  } finally {
    await pool.end();
  }
}

continueImport();