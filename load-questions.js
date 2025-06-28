import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Read Excel file
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${jsonData.length} rows in Excel file`);
console.log('First few rows:', jsonData.slice(0, 3));

// Map questions with images
const questionsWithImages = [21, 55, 70, 130, 176, 181, 187, 209, 216, 235];

// Process questions
const questions = jsonData.map((row, index) => {
  // Extract question number from "Aufgabe X" format
  const aufgabeMatch = row['Nummerierung'] ? row['Nummerierung'].match(/Aufgabe (\d+)/) : null;
  const questionNumber = aufgabeMatch ? parseInt(aufgabeMatch[1]) : (index + 1);
  
  const questionText = row['Frage'] || '';
  const answers = [
    row['Antwort 1'] || '',
    row['Antwort 2'] || '',
    row['Antwort 3'] || '',
    row['Antwort 4'] || ''
  ].filter(answer => answer && typeof answer === 'string' && answer.trim() !== '');
  
  const correctAnswerText = row['Richtige Antwort'] || '';
  // Find which answer matches the correct answer
  let correctAnswerIndex = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === correctAnswerText || 
        answers[i].includes(correctAnswerText) || 
        correctAnswerText.includes(answers[i])) {
      correctAnswerIndex = i;
      break;
    }
  }
  
  const category = row['Bundesland'] === 'Alle' ? 'Bundesweit' : row['Bundesland'] || 'Allgemein';
  const hasImage = questionsWithImages.includes(questionNumber);
  
  return {
    questionNumber: questionNumber,
    text: questionText,
    answers: answers,
    correctAnswer: correctAnswerIndex,
    explanation: '', // No explanation in the Excel file
    category: category,
    difficulty: 'mittel',
    hasImage: hasImage,
    imagePath: hasImage ? `Frage ${questionNumber}_1751145105597.png` : null
  };
}).filter(q => q.text && q.answers.length > 0);

console.log(`Processed ${questions.length} valid questions`);
console.log(`Questions with images: ${questions.filter(q => q.hasImage).length}`);

// Save to JSON file
fs.writeFileSync('questions-data.json', JSON.stringify(questions, null, 2));
console.log('Questions saved to questions-data.json');