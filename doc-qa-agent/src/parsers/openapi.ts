import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface OpenAPIPath {
  [key: string]: {
    [method: string]: {
      summary?: string;
      parameters?: Array<{
        name: string;
        in: string;
        required?: boolean;
        schema?: { type: string };
      }>;
      requestBody?: {
        required?: boolean;
        content?: Record<string, unknown>;
      };
      responses?: Record<string, unknown>;
    };
  };
}

export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: OpenAPIPath;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

/**
 * Load OpenAPI spec from YAML or JSON file
 */
export async function loadOpenAPISpec(specPath: string): Promise<OpenAPISpec> {
  const filePath = path.resolve(specPath);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`OpenAPI spec not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    // Try YAML first (supports both YAML and JSON)
    const parsed = yaml.load(content) as unknown;
    
    return parsed as OpenAPISpec;
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load and merge multiple OpenAPI specs from a directory
 */
export async function loadOpenAPISpecsFromDirectory(specDir: string): Promise<OpenAPISpec> {
  const dirPath = path.resolve(specDir);
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Spec directory not found: ${dirPath}`);
  }

  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  // Find all YAML and JSON files (exclude base.yaml)
  const files = fs.readdirSync(dirPath)
    .filter(file => /\.(yaml|yml|json)$/.test(file) && file !== 'base.yaml')
    .map(file => path.join(dirPath, file))
    .sort();

  if (files.length === 0) {
    throw new Error(`No OpenAPI specs found in directory: ${dirPath}`);
  }

  console.log(`  Loading ${files.length} spec file(s)...`);

  // Load all specs
  const specs: OpenAPISpec[] = [];
  
  for (const file of files) {
    try {
      const spec = await loadOpenAPISpec(file);
      specs.push(spec);
      console.log(`  ✓ Loaded: ${path.basename(file)}`);
    } catch (error) {
      throw new Error(`Failed to load ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Merge all specs
  return mergeOpenAPISpecs(specs);
}

/**
 * Merge multiple OpenAPI specs into one
 */
function mergeOpenAPISpecs(specs: OpenAPISpec[]): OpenAPISpec {
  if (specs.length === 0) {
    throw new Error('No specs to merge');
  }

  if (specs.length === 1) {
    return specs[0];
  }

  // Start with the first spec
  const merged: OpenAPISpec = {
    openapi: specs[0].openapi,
    info: specs[0].info,
    paths: { ...specs[0].paths },
    components: specs[0].components ? { ...specs[0].components } : undefined
  };

  // Merge remaining specs
  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];

    // Merge paths
    merged.paths = {
      ...merged.paths,
      ...spec.paths
    };

    // Merge components (schemas, etc.)
    if (spec.components) {
      if (!merged.components) {
        merged.components = {};
      }

      if (spec.components.schemas) {
        merged.components.schemas = {
          ...(merged.components.schemas || {}),
          ...spec.components.schemas
        };
      }

      // Merge other component types as needed
      for (const [key, value] of Object.entries(spec.components)) {
        if (key !== 'schemas' && typeof value === 'object') {
          merged.components[key as keyof typeof merged.components] = {
            ...(merged.components[key as keyof typeof merged.components] || {}),
            ...value
          };
        }
      }
    }
  }

  return merged;
}

/**
 * Normalize endpoint path (replace params with placeholders)
 */
export function normalizeEndpoint(endpoint: string): string {
  // Replace parameter patterns like {id} or :id with {param}
  return endpoint
    .replace(/:\w+/g, '{param}')
    .replace(/\/\{[^}]+\}/g, '/{param}');
}

/**
 * Find matching path in OpenAPI spec
 */
export function findMatchingPath(
  endpoint: string,
  paths: OpenAPIPath
): [string, OpenAPIPath[string]] | null {
  // Exact match first
  if (paths[endpoint]) {
    return [endpoint, paths[endpoint]];
  }

  // Try normalizing the endpoint
  const normalized = normalizeEndpoint(endpoint);
  for (const [specPath, pathItem] of Object.entries(paths)) {
    if (normalizeEndpoint(specPath) === normalized) {
      return [specPath, pathItem];
    }
  }

  // Try partial match (prefix matching)
  const endpointParts = endpoint.split('/').filter(p => p);
  for (const [specPath] of Object.entries(paths)) {
    const specParts = specPath.split('/').filter(p => p);
    if (specParts.length === endpointParts.length) {
      let matches = true;
      for (let i = 0; i < specParts.length; i++) {
        // Allow {param} style placeholders to match anything
        if (!specParts[i].startsWith('{') && specParts[i] !== endpointParts[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return [specPath, paths[specPath]];
      }
    }
  }

  return null;
}

/**
 * Get allowed methods for an endpoint
 */
export function getAllowedMethods(pathItem: OpenAPIPath[string]): string[] {
  const methods = Object.keys(pathItem).filter(
    key => !key.startsWith('x-') && key !== 'parameters'
  );
  return methods.map(m => m.toUpperCase());
}

/**
 * Get required parameters for an endpoint method
 */
export function getRequiredParameters(
  pathItem: OpenAPIPath[string],
  method: string
): Array<{ name: string; in: string; type?: string }> {
  const operation = pathItem[method.toLowerCase()];
  if (!operation || !operation.parameters) {
    return [];
  }

  return operation.parameters
    .filter(p => p.required)
    .map(p => ({
      name: p.name,
      in: p.in,
      type: p.schema?.type || 'string'
    }));
}
