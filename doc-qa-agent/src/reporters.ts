import { ValidationResult, ValidationError } from './validators.js';

/**
 * Generate markdown report from validation results
 */
export function generateMarkdownReport(results: ValidationResult[]): string {
  const lines: string[] = [];
  
  lines.push('# Documentation QA Report\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  // Summary section
  let totalExamples = 0;
  let totalPassed = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    totalExamples += result.summary.total;
    totalPassed += result.summary.passed;
    totalErrors += result.examples.reduce((sum, ex) => sum + ex.errors.filter(e => e.type === 'error').length, 0);
    totalWarnings += result.examples.reduce((sum, ex) => sum + ex.errors.filter(e => e.type === 'warning').length, 0);
  }

  lines.push('## Summary\n');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Examples | ${totalExamples} |`);
  lines.push(`| Passed | ${totalPassed} ✅ |`);
  lines.push(`| Errors | ${totalErrors} ❌ |`);
  lines.push(`| Warnings | ${totalWarnings} ⚠️ |`);
  lines.push('');

  // Results by file
  for (const result of results) {
    if (result.examples.length === 0) continue;

    lines.push(`## ${result.filePath}\n`);
    lines.push(`**Status:** ${result.summary.failed === 0 ? '✅ PASS' : '❌ FAIL'}`);
    lines.push(`(${result.summary.passed}/${result.summary.total} examples passed)\n`);

    for (const example of result.examples) {
      if (example.errors.length === 0) {
        lines.push(`- ✅ **Line ${example.lineNumber}:** \`${example.method} ${example.endpoint}\``);
      } else {
        lines.push(`- ❌ **Line ${example.lineNumber}:** \`${example.method} ${example.endpoint}\``);
        
        for (const error of example.errors) {
          const icon = error.type === 'error' ? '🔴' : '🟡';
          lines.push(`  - ${icon} **[${error.severity.toUpperCase()}]** ${error.message}`);
          if (error.suggestion) {
            lines.push(`    - 💡 Suggestion: ${error.suggestion}`);
          }
        }
      }
    }
    lines.push('');
  }

  // Exit code recommendation
  lines.push('## Recommendations\n');
  if (totalErrors > 0) {
    lines.push(`- **Fix ${totalErrors} error(s)** before publishing documentation`);
  }
  if (totalWarnings > 0) {
    lines.push(`- **Review ${totalWarnings} warning(s)** for best practices`);
  }
  if (totalErrors === 0 && totalWarnings === 0) {
    lines.push('- ✅ All validation checks passed!');
  }

  return lines.join('\n');
}

/**
 * Generate console output report
 */
export function generateConsoleReport(results: ValidationResult[]): string {
  const lines: string[] = [];
  
  lines.push('\n📋 DOCUMENTATION QA REPORT');
  lines.push('='.repeat(70));
  
  lines.push('\n📋 VALIDATION CHECKS:');
  lines.push('  ✓ Endpoint exists in OpenAPI spec');
  lines.push('  ✓ HTTP method (GET, POST, etc.) is allowed');
  lines.push('  ✓ Required parameters are present');
  lines.push('  ⚠ Authorization headers included\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    const errors = result.examples.reduce((sum, ex) => sum + ex.errors.filter(e => e.type === 'error').length, 0);
    const warnings = result.examples.reduce((sum, ex) => sum + ex.errors.filter(e => e.type === 'warning').length, 0);
    
    totalErrors += errors;
    totalWarnings += warnings;

    const status = errors === 0 ? '✅ PASS' : '❌ FAIL';
    lines.push(`${status} ${result.filePath}`);
    lines.push(`  Passed: ${result.summary.passed}/${result.summary.total} examples`);

    for (const example of result.examples) {
      const endpoint = example.endpoint || '(empty)';
      
      if (example.errors.length === 0) {
        lines.push(`  ✅ Line ${example.lineNumber}: ${example.method} ${endpoint}`);
      } else {
        lines.push(`\n  Line ${example.lineNumber}: ${example.method} ${endpoint}`);
        
        for (const error of example.errors) {
          const icon = error.type === 'error' ? '  ❌' : '  ⚠️';
          lines.push(`  ${icon} ${error.message}`);
          if (error.suggestion) {
            lines.push(`     💡 ${error.suggestion}`);
          }
        }
      }
    }
    lines.push('');
  }

  lines.push('='.repeat(70));
  lines.push(`Total Summary: ${totalErrors} errors, ${totalWarnings} warnings`);
  
  if (totalErrors > 0) {
    lines.push('\n❌ Validation FAILED');
    process.exitCode = 1;
  } else if (totalWarnings > 0) {
    lines.push('\n⚠️  Validation PASSED with warnings');
    process.exitCode = 0;
  } else {
    lines.push('\n✅ Validation PASSED');
    process.exitCode = 0;
  }

  return lines.join('\n');
}
