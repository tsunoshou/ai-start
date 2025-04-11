import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const migrationMapPath = path.resolve('docs/refactoring/migration-map.json');
const dryRun = process.argv.includes('--dry-run'); // Dry run flag

console.log(`Loading migration map from: ${migrationMapPath}`);

let migrationMap;
try {
  const fileContent = fs.readFileSync(migrationMapPath, 'utf-8');
  migrationMap = JSON.parse(fileContent);
} catch (error) {
  console.error(`Error reading or parsing migration map: ${error.message}`);
  process.exit(1);
}

console.log(`Found ${migrationMap.length} entries in the migration map.`);

const commands = [];

for (const entry of migrationMap) {
  const originalPath = entry.original_path;
  const newPath = entry.new_path;

  if (!originalPath || !newPath) {
    console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
    continue;
  }

  // Check if the original file/directory exists
  if (!fs.existsSync(originalPath)) {
    console.warn(`Skipping: Original path not found: ${originalPath}`);
    continue;
  }

  // Create the target directory if it doesn't exist
  const newDirPath = path.dirname(newPath);
  if (!fs.existsSync(newDirPath)) {
    try {
      // Only create directory if not in dry run
      if (!dryRun) {
        fs.mkdirSync(newDirPath, { recursive: true });
        console.log(`Created directory: ${newDirPath}`);
      } else {
        console.log(`[Dry Run] Would create directory: ${newDirPath}`);
      }
    } catch (error) {
      console.error(`Error creating directory ${newDirPath}: ${error.message}`);
      // Decide if you want to stop or continue on directory creation error
      continue; // Skip this entry if directory creation fails
    }
  }

  // Prepare git mv command
  const command = `git mv "${originalPath}" "${newPath}"`;
  commands.push(command);
}

console.log(`\n${commands.length} git mv commands prepared.`);

if (dryRun) {
  console.log('\n--- Dry Run Mode ---');
  console.log('The following commands would be executed:');
  commands.forEach(cmd => console.log(cmd));
  console.log('\nRun without --dry-run to execute the commands.');
} else {
  console.log('\nExecuting git mv commands...');
  let errors = 0;
  for (const cmd of commands) {
    try {
      console.log(`Executing: ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error executing command: ${cmd}`);
      console.error(error.message);
      errors++;
      // Optionally, decide whether to stop on first error or continue
    }
  }

  if (errors > 0) {
    console.error(`\n${errors} command(s) failed. Please check the output above.`);
    process.exit(1);
  } else {
    console.log('\nFile migration commands executed successfully.');
  }
} 