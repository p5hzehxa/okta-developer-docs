import * as fs from 'fs';
import * as path from 'path';

export interface ParsedCurlExample {
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  body?: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  lineNumber: number;
  codeBlock: string;
}

/**
 * Extract curl examples from markdown file
 */
export function extractCurlExamples(filePath: string): ParsedCurlExample[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const examples: ParsedCurlExample[] = [];

  let inCodeBlock = false;
  let currentBlock: string[] = [];
  let blockStartLine = 0;
  let blockLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect code block start - support both indented and non-indented code blocks
    const codeBlockMatch = line.match(/^\s*```/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        blockStartLine = i + 1;
        blockLanguage = line.trim().slice(3);
        currentBlock = [];
      } else {
        inCodeBlock = false;
        
        // Process block if it's bash or curl
        if (['bash', 'curl', 'sh', 'shell'].includes(blockLanguage)) {
          const blockContent = currentBlock.join('\n');
          const parsed = parseCurlBlock(blockContent, blockStartLine);
          if (parsed) {
            examples.push(parsed);
          }
        }
        currentBlock = [];
      }
    } else if (inCodeBlock) {
      currentBlock.push(line);
    }
  }

  return examples;
}

/**
 * Parse individual curl command from a code block
 */
function parseCurlBlock(blockContent: string, lineNumber: number): ParsedCurlExample | null {
  // Find curl command (might span multiple lines)
  const curlMatch = blockContent.match(/curl\s+/i);
  if (!curlMatch) {
    return null;
  }

  // Clean up the block - remove line continuations
  const cleaned = blockContent
    .split('\n')
    .map(line => line.replace(/\\\s*$/, ''))
    .join(' ');

  const example: ParsedCurlExample = {
    method: 'GET',
    endpoint: '',
    headers: {},
    pathParams: {},
    queryParams: {},
    lineNumber,
    codeBlock: blockContent
  };

  // Extract method
  // Support both -X POST and --request POST formats
  let methodMatch = cleaned.match(/-X\s+([A-Z]+)/i);
  if (!methodMatch) {
    methodMatch = cleaned.match(/--request\s+([A-Z]+)/i);
  }
  if (methodMatch) {
    example.method = methodMatch[1].toUpperCase();
  }

  // Extract URL - the endpoint URL is typically at the end or after -d data
  // Strategy: Look for URLs outside of quoted JSON/data
  // 1. First try to find URL in quotes at the end (after the -d data)
  // 2. Then try to find URL in single quotes at the end
  // 3. Fall back to finding the last URL which is usually the endpoint
  let urlMatch = null;
  
  // Try to match URL in double quotes followed by end of string
  urlMatch = cleaned.match(/"\s*(https?:\/\/[^\s"]+)\s*"?\s*$/);
  if (!urlMatch) {
    // Try to match URL in single quotes followed by end of string
    urlMatch = cleaned.match(/'\s*(https?:\/\/[^\s']+)\s*'?\s*$/);
  }
  if (!urlMatch) {
    // Try unquoted URL at the end
    urlMatch = cleaned.match(/(https?:\/\/[^\s]+)\s*$/);
  }
  if (!urlMatch) {
    // Fall back to first URL found (may be in data, but better than nothing)
    urlMatch = cleaned.match(/(https?:\/\/[^\s'"]+)/);
  }
  
  if (urlMatch) {
    const url = urlMatch[1];
    // Debug: Log the extracted URL
    process.env.DEBUG && console.log(`[DEBUG] Line ${lineNumber}: Extracted URL: "${url}"`);
    example.endpoint = extractEndpointFromUrl(url);
    // Debug: Log the extracted endpoint
    process.env.DEBUG && console.log(`[DEBUG] Line ${lineNumber}: Extracted endpoint: "${example.endpoint}"`);
    extractPathParams(url, example.pathParams);
    extractQueryParams(url, example.queryParams);
  } else {
    // Debug: No URL found
    process.env.DEBUG && console.log(`[DEBUG] Line ${lineNumber}: No URL found in cleaned content`);
    process.env.DEBUG && console.log(`[DEBUG] Line ${lineNumber}: Cleaned content preview: "${cleaned.substring(0, 200)}..."`);
  }

  // Extract headers
  // Support both -H and --header formats
  const headerMatches = cleaned.matchAll(/(?:-H|--header)\s+['"]([^'":]+):\s*([^'"]+)['"]/g);
  for (const match of headerMatches) {
    example.headers[match[1].toLowerCase()] = match[2].trim();
  }

  // Extract body
  // Support both -d and --data formats
  let bodyMatch = cleaned.match(/(?:-d|--data)\s+['"](.+?)['"](?:\s+|$)/s);
  if (bodyMatch) {
    example.body = bodyMatch[1];
  }

  return example;
}

/**
 * Extract endpoint path from full URL
 */
function extractEndpointFromUrl(url: string): string {
  try {
    // Handle URLs with variables like {yourHubAccessToken}
    const urlObj = new URL(url.replace(/\{[^}]+\}/g, 'PLACEHOLDER'));
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, extract path manually
    const match = url.match(/(?:https?:\/\/)?[^\/]+(.*)$/);
    return match ? match[1] : url;
  }
}

/**
 * Extract path parameters from URL
 */
function extractPathParams(url: string, params: Record<string, string>): void {
  const paramMatches = url.matchAll(/\{([^}]+)\}/g);
  for (const match of paramMatches) {
    params[match[1]] = `{${match[1]}}`;
  }
}

/**
 * Extract query parameters from URL
 */
function extractQueryParams(url: string, params: Record<string, string>): void {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return;

  const queryString = url.substring(queryIndex + 1);
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
}
