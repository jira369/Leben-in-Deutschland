const { Pool, neonConfig } = require('@neondatabase/serverless');
const fs = require('fs');

neonConfig.webSocketConstructor = require('ws');

async function executeCompleteRepair() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Starting mass repair of ALL 460 questions...');
    
    // Read complete repair file
    const completeSQL = fs.readFileSync('complete-repair.sql', 'utf8');
    const commands = completeSQL.split('\n').filter(line => line.trim().startsWith('UPDATE'));
    
    console.log(`Executing ${commands.length} repair commands in transaction...`);
    
    // Execute all in one transaction for speed
    await pool.query('BEGIN');
    
    let executed = 0;
    for (const command of commands) {
      try {
        await pool.query(command);
        executed++;
        
        if (executed % 100 === 0) {
          console.log(`Progress: ${executed}/${commands.length} commands executed`);
        }
      } catch (error) {
        console.error(`Error on command ${executed + 1}: ${error.message}`);
        // Don't break - continue with other commands
      }
    }
    
    await pool.query('COMMIT');
    console.log(`Transaction committed. ${executed} commands executed successfully.`);
    
    // Final verification
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN jsonb_array_length(answers) = 4 THEN 1 END) as complete_answers,
        COUNT(CASE WHEN jsonb_array_length(answers) < 4 THEN 1 END) as incomplete_answers
      FROM questions
    `);
    
    const stats = result.rows[0];
    console.log('\n=== FINAL VERIFICATION ===');
    console.log(`Total questions: ${stats.total}`);
    console.log(`Questions with 4 answers: ${stats.complete_answers}`);
    console.log(`Questions with <4 answers: ${stats.incomplete_answers}`);
    
    if (stats.complete_answers == 460) {
      console.log('\n🎉 SUCCESS: ALL 460 QUESTIONS FULLY REPAIRED!');
    } else {
      console.log(`\n⚠️  WARNING: ${stats.incomplete_answers} questions still need repair`);
    }
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Transaction failed:', error.message);
  } finally {
    await pool.end();
  }
}

executeCompleteRepair();