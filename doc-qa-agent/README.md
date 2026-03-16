# Doc QA Agent

A CLI tool to validate documentation examples against OpenAPI specifications.

## Features

- ✅ Extract curl examples from markdown files
- ✅ Load and parse OpenAPI 3.0 specs (YAML and JSON)
- ✅ Load multiple specs from a directory and merge them
- ✅ Validate endpoint paths against spec
- ✅ Check HTTP methods are allowed
- ✅ Verify required parameters are present
- ✅ Generate detailed validation reports
- ✅ Batch process multiple documentation files

## Installation

```bash
npm install
npm run build
```

## Usage

### Check a single file with single spec

```bash
npm run check <path-to-file.md> --spec <path-to-openapi-spec.yaml>
```

### Check a single file with spec directory

```bash
npm run check <path-to-file.md> --spec-dir <path-to-specs-directory>
```

Example:
```bash
npm run check ../packages/@okta/vuepress-site/docs/guides/secure-oauth-between-orgs/main/index.md --spec-dir ./specs
```

### Check all markdown files in a directory with spec directory

```bash
npm run check-all <directory> --spec-dir <path-to-specs-directory>
```

Example:
```bash
npm run check-all ../packages/@okta/vuepress-site/docs --spec-dir ./specs
```

### Check all markdown files with single spec file

```bash
npm run check-all <directory> --spec <path-to-openapi-spec.yaml>
```

### Output report to file

Add the `-o` or `--output` flag to save a markdown report:

```bash
npm run check <file.md> --spec-dir ./specs --output report.md
```

### Suppress console output

Add the `-q` or `--quiet` flag:

```bash
npm run check <file.md> --spec-dir ./specs --quiet
```

## Spec Directory Support

The tool supports loading multiple OpenAPI specs from a directory:

- Automatically discovers all `.yaml`, `.yml`, and `.json` files
- Merges all specs into a single consolidated spec
- Combines all paths, schemas, and components

This is useful when you have specs split across multiple files (e.g., one per API resource):

```
specs/
├── users-api.yaml
├── apps-api.yaml
├── groups-api.yaml
└── authentication-api.yaml
```

All endpoints from these files will be merged and validated against your documentation examples.

For each curl example found in your documentation, the tool checks:

1. **Endpoint exists** - Verifies the API endpoint is documented in the OpenAPI spec
2. **Method allowed** - Confirms the HTTP method (GET, POST, etc.) is valid for that endpoint
3. **Required parameters** - Ensures all required parameters (path, query, headers) are present
4. **Authorization** - Warns if authorization headers are missing

## Output Format

### Console Report

```
📋 DOCUMENTATION QA REPORT
==================================================

✅ PASS docs/guides/example.md
  Passed: 5/5 examples
...

==================================================
Total Summary: 0 errors, 1 warnings

✅ Validation PASSED
```

### Markdown Report

Detailed markdown report with:
- Summary statistics
- File-by-file results
- Line numbers for each example
- Error messages and suggestions
- Recommendations

## Development

### Project Structure

```
src/
├── cli.ts                 # CLI interface
├── validators.ts         # Validation logic
├── reporters.ts          # Report generation
└── parsers/
    ├── markdown.ts       # Extract curl examples
    └── openapi.ts        # Load OpenAPI specs
```

### Build & Run

```bash
# Build TypeScript
npm run build

# Run from source (development)
npm run dev -- check <file.md> --spec <spec.yaml>

# Run compiled version
npm start check <file.md> --spec <spec.yaml>
```

## Exit Codes

- `0` - Validation passed
- `1` - Validation failed (errors found) or file not found

## Limitations (MVP)

- Only validates endpoints and basic parameters
- Does not validate request/response body schemas
- Does not check response examples
- Does not validate deprecated endpoints
- Simple path matching doesn't support complex OpenAPI patterns

## Next Steps

1. Add request/response body schema validation
2. Validate example responses against spec
3. Flag deprecated endpoints
4. Support for multiple OpenAPI specs
5. Integration with CI/CD pipelines
6. Custom validation rules

## License

Apache-2.0
