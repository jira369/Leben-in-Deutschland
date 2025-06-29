const fs = require('fs');
const { execSync } = require('child_process');

// Read all SQL commands
const allCommands = fs.readFileSync('complete-repair.sql', 'utf8').split('\n').filter(line => line.trim().startsWith('UPDATE'));

console.log(`Executing ${allCommands.length} SQL repair commands...`);

// Split into manageable chunks
const chunkSize = 20;
const chunks = [];
for (let i = 0; i < allCommands.length; i += chunkSize) {
  chunks.push(allCommands.slice(i, i + chunkSize));
}

console.log(`Split into ${chunks.length} chunks of max ${chunkSize} commands each`);

// Execute each chunk
chunks.forEach((chunk, index) => {
  const chunkFile = `chunk-${index + 1}.sql`;
  fs.writeFileSync(chunkFile, chunk.join('\n') + '\n');
  console.log(`Created ${chunkFile} with ${chunk.length} commands`);
});

console.log('All chunks created. Ready for execution.');