const fs = require('fs');

// Lade die extrahierten bundesweiten Fragen
const data = JSON.parse(fs.readFileSync('federal-questions.json', 'utf8'));
const questions = data.questions;

console.log(`Füge ${questions.length} bundesweite Fragen in Batches ein...`);

// Teile die Fragen in Batches von 50
const batchSize = 50;
const batches = [];

for (let i = 0; i < questions.length; i += batchSize) {
  batches.push(questions.slice(i, i + batchSize));
}

console.log(`Erstelle ${batches.length} Batches mit je max. ${batchSize} Fragen`);

// Erstelle SQL-Files für jeden Batch
batches.forEach((batch, index) => {
  const sqlInserts = batch.map(q => {
    const escapedText = q.text.replace(/'/g, "''");
    const escapedAnswers = q.answers.replace(/'/g, "''");
    const escapedExplanation = q.explanation.replace(/'/g, "''");
    const imagePath = q.image_path ? `'${q.image_path}'` : 'NULL';
    
    return `(${q.id}, '${escapedText}', '${escapedAnswers}'::jsonb, ${q.correct_answer}, '${escapedExplanation}', 'Bundesweit', 'mittel', ${q.has_image}, ${imagePath})`;
  }).join(',\n  ');

  const sqlStatement = `INSERT INTO questions (id, text, answers, correct_answer, explanation, category, difficulty, has_image, image_path) 
VALUES 
  ${sqlInserts};`;

  fs.writeFileSync(`batch_${index + 1}.sql`, sqlStatement);
  console.log(`✅ Batch ${index + 1} erstellt (${batch.length} Fragen)`);
});

console.log('\n🚀 Alle Batch-Files erstellt. Führe sie nacheinander aus...');