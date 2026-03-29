#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of release notes files to process
const releaseNotesFiles = [
  '../../docs/release-notes/2026/index.md',
  '../../docs/release-notes/2026-okta-access-gateway/index.md',
  '../../docs/release-notes/2026-okta-aerial/index.md',
  '../../docs/release-notes/2026-okta-identity-engine/index.md',
  '../../docs/release-notes/2026-okta-identity-governance/index.md',
  '../../docs/release-notes/2026-okta-mcp-server/index.md',
  '../../docs/release-notes/2026-okta-privileged-access/index.md',
];

// Get current date in ISO format (YYYY-MM-DDTHH:mm:ssZ)
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const pubDate = `<!-- Published on: ${year}-${month}-${day}T12:00:00Z -->`;

let totalUpdated = 0;

// Process each file
releaseNotesFiles.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  // Extract release notes folder for display (e.g., "2026/index.md" or "2026-okta-aerial/index.md")
  const displayPath = filePath.split('release-notes/')[1];

  // Skip if file doesn't exist
  if (!fs.existsSync(fullPath)) {
    console.log(`⊘ File not found: ${displayPath}`);
    return;
  }

  // Read the file
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  let modified = false;

  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is an H3 heading
    if (line.startsWith('### ')) {
      // Check if the next line exists and is blank
      if (i + 1 < lines.length && lines[i + 1].trim() === '') {
        // Check if the line after the blank line is NOT already a publish date comment
        if (i + 2 < lines.length && !lines[i + 2].startsWith('<!-- Published on:')) {
          // Replace the blank line with the publish date and add a blank line after
          lines[i + 1] = pubDate;
          lines.splice(i + 2, 0, '');
          modified = true;
          i++; // Skip the inserted line
        }
      }
    }
  }

  // Write the file back if modified
  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(`✓ Updated ${displayPath}`);
    totalUpdated++;
  } else {
    console.log(`ℹ No changes needed for ${displayPath}`);
  }
});

console.log(`\n✓ Processed ${releaseNotesFiles.length} files. Updated: ${totalUpdated}`);

