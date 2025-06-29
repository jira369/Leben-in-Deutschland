const fs = require('fs');
const XLSX = require('xlsx');

// Lade das Excel-File
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Bundesländer Zuordnung (Zeilen 302-461, aber Array ist 0-indexed, also 301-460)
const bundeslaender = [
  { name: 'Baden-Württemberg', start: 301, end: 310 },
  { name: 'Bayern', start: 311, end: 320 },
  { name: 'Berlin', start: 321, end: 330 },
  { name: 'Brandenburg', start: 331, end: 340 },
  { name: 'Bremen', start: 341, end: 350 },
  { name: 'Hamburg', start: 351, end: 360 },
  { name: 'Hessen', start: 361, end: 370 },
  { name: 'Mecklenburg-Vorpommern', start: 371, end: 380 },
  { name: 'Niedersachsen', start: 381, end: 390 },
  { name: 'Nordrhein-Westfalen', start: 391, end: 400 },
  { name: 'Rheinland-Pfalz', start: 401, end: 410 },
  { name: 'Saarland', start: 411, end: 420 },
  { name: 'Sachsen', start: 421, end: 430 },
  { name: 'Sachsen-Anhalt', start: 431, end: 440 },
  { name: 'Schleswig-Holstein', start: 441, end: 450 },
  { name: 'Thüringen', start: 451, end: 460 }
];

// Funktion um Antworten zu finden
function findCorrectAnswer(row, correctAnswerText) {
  const answers = [row[3], row[4], row[5], row[6]].filter(a => a);
  const correctIndex = answers.findIndex(answer => 
    answer && correctAnswerText && 
    typeof answer === 'string' && typeof correctAnswerText === 'string' &&
    answer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim()
  );
  return correctIndex >= 0 ? correctIndex + 1 : 1;
}

// Extrahiere Bundesländerfragen
const stateQuestions = [];
let nextId = 301; // Start mit ID 301

bundeslaender.forEach(state => {
  console.log(`\nVerarbeite ${state.name}:`);
  
  for (let i = state.start; i <= state.end; i++) {
    if (i < data.length && data[i]) {
      const row = data[i];
      if (row[2]) { // Frage vorhanden
        const questionNum = i - state.start + 1;
        const isImageQuestion = questionNum === 1 || questionNum === 8;
        
        const answers = [row[3], row[4], row[5], row[6]].filter(a => a && typeof a === 'string' && a.trim());
        const correctAnswerIndex = findCorrectAnswer(row, row[7]);
        
        const question = {
          id: nextId++,
          text: (row[2] || '').toString().trim(),
          answers: JSON.stringify(answers),
          correct_answer: correctAnswerIndex,
          explanation: `Offizielle ${state.name} Frage ${questionNum} (Zeile ${i + 1} im Originalexcel).`,
          category: state.name === 'Nordrhein-Westfalen' ? 'NRW' : state.name,
          difficulty: 'mittel',
          has_image: isImageQuestion,
          image_path: isImageQuestion ? `state_${state.name.toLowerCase()}_${questionNum}.png` : null
        };
        
        stateQuestions.push(question);
        console.log(`  Frage ${questionNum}: ${question.text.substring(0, 50)}...${isImageQuestion ? ' [BILD]' : ''}`);
      }
    }
  }
});

// Speichere als JSON für die Datenbank
const output = {
  timestamp: new Date().toISOString(),
  total_questions: stateQuestions.length,
  questions: stateQuestions
};

fs.writeFileSync('state-questions.json', JSON.stringify(output, null, 2));
console.log(`\n✅ ${stateQuestions.length} Bundesländerfragen extrahiert und in state-questions.json gespeichert`);

// Erstelle SQL-Insert Statement
const sqlInserts = stateQuestions.map(q => {
  const escapedText = q.text.replace(/'/g, "''");
  const escapedAnswers = q.answers.replace(/'/g, "''");
  const escapedExplanation = q.explanation.replace(/'/g, "''");
  const escapedCategory = q.category.replace(/'/g, "''");
  const imagePath = q.image_path ? `'${q.image_path}'` : 'NULL';
  
  return `(${q.id}, '${escapedText}', '${escapedAnswers}'::jsonb, ${q.correct_answer}, '${escapedExplanation}', '${escapedCategory}', '${q.difficulty}', ${q.has_image}, ${imagePath})`;
}).join(',\n  ');

const sqlStatement = `INSERT INTO questions (id, text, answers, correct_answer, explanation, category, difficulty, has_image, image_path) 
VALUES 
  ${sqlInserts};`;

fs.writeFileSync('insert-state-questions.sql', sqlStatement);
console.log('✅ SQL-Insert Statement in insert-state-questions.sql gespeichert');