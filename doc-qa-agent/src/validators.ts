import { ParsedCurlExample } from './parsers/markdown.js';
import {
  OpenAPISpec,
  OpenAPIPath,
  findMatchingPath,
  getAllowedMethods,
  getRequiredParameters
} from './parsers/openapi.js';

export interface ValidationError {
  type: 'error' | 'warning';
  severity: 'high' | 'medium' | 'low';
  message: string;
  lineNumber: number;
  suggestion?: string;
}

export interface ValidationResult {
  filePath: string;
  examples: Array<{
    endpoint: string;
    method: string;
    lineNumber: number;
    errors: ValidationError[];
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * Validate curl examples against OpenAPI spec
 */
export function validateExamples(
  examples: ParsedCurlExample[],
  spec: OpenAPISpec,
  filePath: string
): ValidationResult {
  const results: ValidationResult = {
    filePath,
    examples: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  for (const example of examples) {
    const errors: ValidationError[] = [];

    // Check if endpoint exists in spec
    const matchedPath = findMatchingPath(example.endpoint, spec.paths);

    if (!matchedPath) {
      // Enhanced error message showing what was searched vs what was available
      errors.push({
        type: 'error',
        severity: 'high',
        message: `Endpoint not found in OpenAPI spec: ${example.endpoint}`,
        lineNumber: example.lineNumber,
        suggestion: `Searched for: "${example.endpoint}" | Available endpoints: ${Object.keys(spec.paths).slice(0, 3).join(', ')}...`
      });
    } else {
      const [specPath, pathItem] = matchedPath;

      // Check if method is allowed
      const allowedMethods = getAllowedMethods(pathItem);
      if (!allowedMethods.includes(example.method)) {
        errors.push({
          type: 'error',
          severity: 'high',
          message: `Method ${example.method} not allowed for ${example.endpoint}`,
          lineNumber: example.lineNumber,
          suggestion: `Found endpoint "${specPath}" but method ${example.method} is not supported. Allowed methods: ${allowedMethods.join(', ')}`
        });
      } else {
        // Check required parameters
        const requiredParams = getRequiredParameters(pathItem, example.method);
        
        for (const requiredParam of requiredParams) {
          let found = false;

          if (requiredParam.in === 'path') {
            found = Object.keys(example.pathParams).includes(requiredParam.name);
          } else if (requiredParam.in === 'query') {
            found = Object.keys(example.queryParams).includes(requiredParam.name);
          } else if (requiredParam.in === 'header') {
            found = Object.keys(example.headers).includes(requiredParam.name.toLowerCase());
          }

          if (!found) {
            errors.push({
              type: 'error',
              severity: 'high',
              message: `Required ${requiredParam.in} parameter missing: ${requiredParam.name}`,
              lineNumber: example.lineNumber,
              suggestion: `Add -H "${requiredParam.name}: <value>"` + (requiredParam.in === 'path' ? ` to the URL` : '')
            });
          }
        }

        // Check for authorization header
        if (!example.headers['authorization'] && !example.headers['x-api-key']) {
          errors.push({
            type: 'warning',
            severity: 'medium',
            message: 'No authorization header found',
            lineNumber: example.lineNumber,
            suggestion: 'Add -H "Authorization: Bearer {token}"'
          });
        }
      }
    }

    results.summary.total++;
    if (errors.length === 0) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    results.examples.push({
      endpoint: example.endpoint,
      method: example.method,
      lineNumber: example.lineNumber,
      errors
    });
  }

  return results;
}
