import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Read Excel file
const workbook = XLSX.readFile('attached_assets/Einbürgerungstest_1751144681671.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON (raw: true is default — numbers stay as numbers)
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${jsonData.length} rows in Excel file`);

// ---------- Image filename mapping ----------
// Build an index of all image files on disk (attached_assets + public/images)
const imageDirs = ['attached_assets', 'public/images'];
const imageFiles = [];
for (const dir of imageDirs) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (/\.(png|jpg|jpeg)$/i.test(f)) {
        imageFiles.push({ dir, file: f });
      }
    }
  }
}

/**
 * Match an Excel image name (e.g. "Frage 301 Bayern.png") to the actual
 * file on disk (e.g. "Frage 301 Bayern_1751220678919.png").
 * Returns the filename (without directory) or null.
 */
function findImageFile(excelName) {
  if (!excelName || typeof excelName !== 'string') return null;
  const name = excelName.trim();
  if (!name.endsWith('.png') && !name.endsWith('.jpg')) return null;

  // Strip extension to get the base prefix
  const prefix = name.replace(/\.\w+$/, ''); // e.g. "Frage 301 Bayern"

  // Try exact match first, then prefix match with _timestamp
  for (const { file } of imageFiles) {
    const fileBase = file.replace(/\.\w+$/, ''); // e.g. "Frage 301 Bayern_1751220678919"
    if (fileBase === prefix || fileBase.startsWith(prefix + '_')) {
      return file;
    }
  }
  return null;
}

// ---------- German month names for date serial conversion ----------
const GERMAN_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

/** Convert Excel date serial number to "Tag. Monat" format (e.g. "17. Juni") */
function excelSerialToGermanDate(serial) {
  const epoch = new Date(1899, 11, 30);
  const d = new Date(epoch.getTime() + serial * 86400000);
  return `${d.getDate()}. ${GERMAN_MONTHS[d.getMonth()]}`;
}

/** Check if a number looks like an Excel date serial (not a year or small number) */
function isDateSerial(n) {
  return typeof n === 'number' && n > 10000 && !(n >= 1900 && n <= 2100);
}

// ---------- Process questions ----------
const questions = jsonData.map((row, index) => {
  // Extract question number from "Aufgabe X" format
  const aufgabeMatch = row['Nummerierung'] ? row['Nummerierung'].match(/Aufgabe (\d+)/) : null;
  const questionNumber = aufgabeMatch ? parseInt(aufgabeMatch[1]) : (index + 1);

  const questionText = row['Frage'] || '';

  // Get raw answers — may be strings or numbers
  const rawAnswers = [
    row['Antwort 1'],
    row['Antwort 2'],
    row['Antwort 3'],
    row['Antwort 4']
  ];

  // Convert answers to strings, handling date serials specially
  const answers = rawAnswers
    .filter(a => a !== undefined && a !== null && a !== '')
    .map(a => {
      if (isDateSerial(a)) return excelSerialToGermanDate(a);
      return String(a).trim();
    })
    .filter(a => a !== '');

  // Find correct answer index
  const rawCorrect = row['Richtige Antwort'];
  let correctAnswerIndex = 0;

  if (rawCorrect !== undefined && rawCorrect !== null) {
    // Convert correct answer the same way we converted the options
    const correctStr = isDateSerial(rawCorrect)
      ? excelSerialToGermanDate(rawCorrect)
      : String(rawCorrect).trim();

    // Find exact match in the converted answers array
    const exactIdx = answers.indexOf(correctStr);
    if (exactIdx !== -1) {
      correctAnswerIndex = exactIdx;
    } else {
      // Fallback: partial match
      for (let i = 0; i < answers.length; i++) {
        if (answers[i].includes(correctStr) || correctStr.includes(answers[i])) {
          correctAnswerIndex = i;
          break;
        }
      }
    }
  }

  // Category mapping
  const category = row['Bundesland'] === 'Alle' ? 'Bundesweit' : row['Bundesland'] || 'Allgemein';

  // Image mapping from Excel's "Bild zur Frage" column
  const excelImageName = row['Bild zur Frage'] || '';
  const imageFile = findImageFile(excelImageName);
  const hasImage = !!imageFile;

  return {
    questionNumber,
    text: questionText,
    answers,
    correctAnswer: correctAnswerIndex + 1, // 1-indexed to match schema
    explanation: '',
    category,
    difficulty: 'mittel',
    hasImage,
    imagePath: imageFile || null
  };
}).filter(q => q.text && q.answers.length > 0);

console.log(`Processed ${questions.length} valid questions`);
console.log(`Questions with images: ${questions.filter(q => q.hasImage).length}`);

// Count by category
const cats = {};
questions.forEach(q => { cats[q.category] = (cats[q.category] || 0) + 1; });
console.log('By category:', JSON.stringify(cats, null, 2));

// List image questions
questions.filter(q => q.hasImage).forEach(q => {
  console.log(`  Image: Q${q.questionNumber} (${q.category}) → ${q.imagePath}`);
});

// Verify no image questions lost
const excelImageCount = jsonData.filter(r => r['Bild zur Frage'] && r['Bild zur Frage'] !== 'Demmin').length;
const mappedImageCount = questions.filter(q => q.hasImage).length;
if (mappedImageCount < excelImageCount) {
  console.warn(`WARNING: ${excelImageCount - mappedImageCount} image questions could not be mapped to files on disk!`);
  const unmapped = jsonData.filter(r => {
    if (!r['Bild zur Frage'] || r['Bild zur Frage'] === 'Demmin') return false;
    return !findImageFile(r['Bild zur Frage']);
  });
  unmapped.forEach(r => console.warn(`  Missing: ${r['Nummerierung']} → ${r['Bild zur Frage']}`));
}

// Save to JSON file
fs.writeFileSync('questions-data.json', JSON.stringify(questions, null, 2));
console.log('Questions saved to questions-data.json');
