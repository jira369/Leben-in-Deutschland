const { Pool, neonConfig } = require('@neondatabase/serverless');
const fs = require('fs');

// WebSocket-Problem beheben
neonConfig.webSocketConstructor = require('ws');

async function executeBatchFixes() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Starte Batch-Ausführung aller SQL-Fixes...');
    
    // Lese alle SQL-Statements
    const allSql = fs.readFileSync('all-questions-fix.sql', 'utf8');
    const statements = allSql.split('\n').filter(line => line.trim().startsWith('UPDATE'));
    
    console.log(`Führe ${statements.length} UPDATE-Statements aus...`);
    
    let updated = 0;
    let errors = 0;
    
    // Führe in kleineren Batches aus für bessere Performance
    const batchSize = 25;
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      
      try {
        await pool.query('BEGIN');
        for (const statement of batch) {
          await pool.query(statement);
          updated++;
        }
        await pool.query('COMMIT');
        
        console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} Fragen aktualisiert (Gesamt: ${updated})`);
        
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`Fehler in Batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        errors += batch.length;
      }
    }
    
    console.log(`\nBatch-Ausführung abgeschlossen:`);
    console.log(`✅ ${updated} Fragen erfolgreich aktualisiert`);
    console.log(`❌ ${errors} Fehler aufgetreten`);
    
    // Verifikation
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN jsonb_array_length(answers) = 4 THEN 1 END) as complete_answers,
        COUNT(CASE WHEN jsonb_array_length(answers) < 4 THEN 1 END) as incomplete_answers,
        COUNT(CASE WHEN answers = '[]'::jsonb THEN 1 END) as empty_answers
      FROM questions
    `);
    
    const stats = result.rows[0];
    console.log('\nVerifikation der Reparatur:');
    console.log(`Gesamtfragen: ${stats.total}`);
    console.log(`Vollständige Antworten (4): ${stats.complete_answers}`);
    console.log(`Unvollständige Antworten (<4): ${stats.incomplete_answers}`);
    console.log(`Leere Antworten: ${stats.empty_answers}`);
    
    if (stats.complete_answers == 460) {
      console.log('\n🎉 ALLE FRAGEN ERFOLGREICH REPARIERT!');
    } else {
      console.log(`\n⚠️  ${460 - stats.complete_answers} Fragen benötigen noch Reparatur`);
    }
    
  } catch (error) {
    console.error('Allgemeiner Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

executeBatchFixes();