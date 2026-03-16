import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { extractCurlExamples } from './parsers/markdown.js';
import { loadOpenAPISpec, loadOpenAPISpecsFromDirectory } from './parsers/openapi.js';
import { validateExamples } from './validators.js';
import { generateMarkdownReport, generateConsoleReport } from './reporters.js';

const VERSION = '0.1.0';

program
  .name('doc-qa')
  .description('Documentation QA agent - validate examples against OpenAPI specs')
  .version(VERSION);

program
  .command('check <file>')
  .description('Check documentation file for API example correctness')
  .option('-s, --spec <path>', 'Path to OpenAPI spec file (YAML or JSON)')
  .option('-d, --spec-dir <path>', 'Path to directory containing OpenAPI specs (YAML or JSON; defaults to ./specs)')
  .option('-o, --output <path>', 'Output markdown report to file')
  .option('-q, --quiet', 'Suppress console output')
  .action(async (file: string, options: { spec?: string; specDir?: string; output?: string; quiet?: boolean }) => {
    try {
      console.log('🔍 Starting documentation QA check...\n');

      // Validate inputs
      if (!fs.existsSync(file)) {
        console.error(`❌ Documentation file not found: ${file}`);
        process.exit(1);
      }

      // Check that both --spec and --spec-dir are not provided
      if (options.spec && options.specDir) {
        console.error('❌ Cannot provide both --spec and --spec-dir options');
        process.exit(1);
      }

      // Use default spec directory if neither option is provided
      const specDir = options.specDir || './specs';
      const specFile = options.spec;

      // Load spec(s)
      let spec;
      if (specFile) {
        if (!fs.existsSync(specFile)) {
          console.error(`❌ OpenAPI spec not found: ${specFile}`);
          process.exit(1);
        }
        console.log(`📚 Loading OpenAPI spec from: ${specFile}`);
        spec = await loadOpenAPISpec(specFile);
      } else {
        console.log(`📚 Loading OpenAPI specs from directory: ${specDir}`);
        spec = await loadOpenAPISpecsFromDirectory(specDir);
      }
      
      console.log(`   Found ${Object.keys(spec.paths).length} endpoints\n`);

      // Extract examples
      console.log(`📄 Parsing documentation: ${file}`);
      const examples = extractCurlExamples(file);
      console.log(`   Found ${examples.length} curl examples\n`);

      if (examples.length === 0) {
        console.log('⚠️  No curl examples found in documentation');
        process.exit(0);
      }

      // Validate examples
      console.log('✅ Validating examples against OpenAPI spec...\n');
      const results = validateExamples(examples, spec, file);

      // Generate reports
      if (!options.quiet) {
        const consoleReport = generateConsoleReport([results]);
        console.log(consoleReport);
      }

      if (options.output) {
        const markdownReport = generateMarkdownReport([results]);
        fs.writeFileSync(options.output, markdownReport);
        console.log(`\n📊 Report saved to: ${options.output}`);
      }

      process.exit(results.summary.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('check-all [dir]')
  .description('Check all markdown files in a directory')
  .option('-s, --spec <path>', 'Path to OpenAPI spec file (YAML or JSON)')
  .option('-d, --spec-dir <path>', 'Path to directory containing OpenAPI specs (YAML or JSON; defaults to ./specs)')
  .option('-o, --output <path>', 'Output markdown report to file')
  .option('-q, --quiet', 'Suppress console output')
  .action(async (dir: string = '.', options: { spec?: string; specDir?: string; output?: string; quiet?: boolean }) => {
    try {
      console.log('🔍 Starting batch documentation QA check...\n');

      // Check that both --spec and --spec-dir are not provided
      if (options.spec && options.specDir) {
        console.error('❌ Cannot provide both --spec and --spec-dir options');
        process.exit(1);
      }

      // Use default spec directory if neither option is provided
      const specDir = options.specDir || './specs';
      const specFile = options.spec;

      // Load spec(s)
      let spec;
      if (specFile) {
        if (!fs.existsSync(specFile)) {
          console.error(`❌ OpenAPI spec not found: ${specFile}`);
          process.exit(1);
        }
        console.log(`📚 Loading OpenAPI spec from: ${specFile}`);
        spec = await loadOpenAPISpec(specFile);
      } else {
        console.log(`📚 Loading OpenAPI specs from directory: ${specDir}`);
        spec = await loadOpenAPISpecsFromDirectory(specDir);
      }
      
      console.log(`   Found ${Object.keys(spec.paths).length} endpoints\n`);

      // Find all markdown files
      const mdFiles = findMarkdownFiles(dir);
      console.log(`📄 Found ${mdFiles.length} markdown files\n`);

      if (mdFiles.length === 0) {
        console.log('⚠️  No markdown files found');
        process.exit(0);
      }

      // Check all files
      const allResults = [];
      for (const mdFile of mdFiles) {
        console.log(`  Checking: ${mdFile}`);
        const examples = extractCurlExamples(mdFile);
        if (examples.length > 0) {
          const results = validateExamples(examples, spec, mdFile);
          allResults.push(results);
        }
      }

      console.log('\n');

      // Generate reports
      if (!options.quiet) {
        const consoleReport = generateConsoleReport(allResults);
        console.log(consoleReport);
      }

      if (options.output) {
        const markdownReport = generateMarkdownReport(allResults);
        fs.writeFileSync(options.output, markdownReport);
        console.log(`\n📊 Report saved to: ${options.output}`);
      }

      const totalFailed = allResults.reduce((sum, r) => sum + r.summary.failed, 0);
      process.exit(totalFailed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

program.parse(process.argv);

// Show help if no command provided
if (process.argv.length < 3) {
  program.help();
}
