
const fs = require('fs');
const path = require('path');

function countLinesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() !== '').length;
    const totalLines = lines.length;
    return { total: totalLines, nonEmpty: nonEmptyLines };
  } catch (error) {
    return { total: 0, nonEmpty: 0 };
  }
}

function isCodeFile(filePath) {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json'];
  const ext = path.extname(filePath).toLowerCase();
  return codeExtensions.includes(ext);
}

function walkDirectory(dir, basePath = '') {
  const excludedDirs = ['node_modules', '.git', 'dist', 'build', '.config', 'attached_assets'];
  const stats = {
    totalFiles: 0,
    totalLines: 0,
    totalNonEmptyLines: 0,
    fileTypes: {},
    directories: {}
  };

  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (!excludedDirs.includes(item)) {
          const subStats = walkDirectory(fullPath, relativePath);
          stats.totalFiles += subStats.totalFiles;
          stats.totalLines += subStats.totalLines;
          stats.totalNonEmptyLines += subStats.totalNonEmptyLines;
          
          // Merge file types
          for (const [ext, count] of Object.entries(subStats.fileTypes)) {
            stats.fileTypes[ext] = (stats.fileTypes[ext] || { files: 0, lines: 0, nonEmpty: 0 });
            stats.fileTypes[ext].files += count.files;
            stats.fileTypes[ext].lines += count.lines;
            stats.fileTypes[ext].nonEmpty += count.nonEmpty;
          }
          
          stats.directories[relativePath] = subStats;
        }
      } else if (isCodeFile(fullPath)) {
        const lineCount = countLinesInFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        
        stats.totalFiles++;
        stats.totalLines += lineCount.total;
        stats.totalNonEmptyLines += lineCount.nonEmpty;
        
        if (!stats.fileTypes[ext]) {
          stats.fileTypes[ext] = { files: 0, lines: 0, nonEmpty: 0 };
        }
        stats.fileTypes[ext].files++;
        stats.fileTypes[ext].lines += lineCount.total;
        stats.fileTypes[ext].nonEmpty += lineCount.nonEmpty;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return stats;
}

// Count lines of code
const projectStats = walkDirectory('.');

console.log('=== COIN GAME - LINES OF CODE ANALYSIS ===\n');

console.log(`📊 SUMMARY:`);
console.log(`Total Code Files: ${projectStats.totalFiles}`);
console.log(`Total Lines: ${projectStats.totalLines.toLocaleString()}`);
console.log(`Non-Empty Lines: ${projectStats.totalNonEmptyLines.toLocaleString()}`);
console.log(`Empty/Whitespace Lines: ${(projectStats.totalLines - projectStats.totalNonEmptyLines).toLocaleString()}\n`);

console.log(`📁 BY FILE TYPE:`);
const sortedTypes = Object.entries(projectStats.fileTypes)
  .sort(([,a], [,b]) => b.nonEmpty - a.nonEmpty);

for (const [ext, stats] of sortedTypes) {
  console.log(`${ext.padEnd(6)}: ${stats.files.toString().padStart(3)} files, ${stats.nonEmpty.toString().padStart(5)} lines`);
}

console.log(`\n🏗️  BY DIRECTORY:`);
const mainDirs = ['client', 'server', 'shared'];
for (const dir of mainDirs) {
  if (projectStats.directories[dir]) {
    const dirStats = projectStats.directories[dir];
    console.log(`${dir.padEnd(8)}: ${dirStats.totalFiles.toString().padStart(3)} files, ${dirStats.totalNonEmptyLines.toString().padStart(5)} lines`);
  }
}

// Detailed breakdown of main game components
console.log(`\n🎮 GAME COMPONENTS BREAKDOWN:`);
const gameComponents = [
  'client/src/components/Game',
  'client/src/lib',
  'server'
];

for (const component of gameComponents) {
  const componentPath = component.replace('/', path.sep);
  if (fs.existsSync(componentPath)) {
    const componentStats = walkDirectory(componentPath);
    console.log(`${component.padEnd(25)}: ${componentStats.totalNonEmptyLines.toString().padStart(5)} lines`);
  }
}
