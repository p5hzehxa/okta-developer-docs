"""
Extract and Test cURL Commands from Markdown

This script extracts cURL commands from bash/sh code blocks in markdown files,
validates their syntax, and optionally executes them with variable substitution.

Usage:
    python test-curl-examples.py <path-to-file.md> [options]
    python test-curl-examples.py --file <path-to-file.md> [options]

Options:
    --file <path>       Path to markdown file to analyze (can also be positional arg)
    --test              Run syntax validation tests on extracted commands
    --execute           Actually execute the curl commands (requires credentials)
    --domain <domain>   Okta domain to substitute (e.g., example.okta.com)
    --token <token>     Bearer token to substitute
    --verbose           Show detailed output

Environment Variables:
    OKTA_DOMAIN         Default Okta domain if --domain not provided
    OKTA_TOKEN          Default access token if --token not provided

Examples:
    python scripts/test-curl-examples.py docs/guides/secure-oauth-between-orgs/main/index.md --test
    python scripts/test-curl-examples.py docs/guides/some-guide/index.md --test --domain example.okta.com --token YOUR_TOKEN
    python scripts/test-curl-examples.py docs/guides/another-guide/index.md --execute --domain example.okta.com --token YOUR_TOKEN --verbose
"""

import re
import subprocess
import sys
import os


def extract_curl_commands(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    curl_commands = []  # List of tuples: (line_number, command)
    lines_list = content.split('\n')

    # Find all bash/sh code blocks with their positions
    i = 0
    while i < len(lines_list):
        line = lines_list[i]
        
        # Look for start of bash/sh code block
        if re.match(r'^```(?:bash|sh)$', line.strip()):
            block_start_line = i
            i += 1
            
            # Process lines until end of code block
            while i < len(lines_list) and not lines_list[i].strip().startswith('```'):
                current_line = lines_list[i].rstrip()
                
                # Look for curl command start
                if current_line.strip().startswith('curl'):
                    command_lines = [current_line.rstrip('\\').strip()]
                    line_number = i + 1  # 1-indexed line number
                    original_i = i
                    i += 1
                    
                    # Collect continuation lines until we hit end of code block or a line that looks like end of command
                    while i < len(lines_list) and not lines_list[i].strip().startswith('```'):
                        next_line = lines_list[i].rstrip()
                        
                        # Check if this line ends the command (contains URL or looks like end of JSON body)
                        if next_line.endswith('```'):
                            break
                        
                        # Add line to command
                        command_lines.append(next_line.rstrip('\\').strip())
                        
                        # Stop if we find a URL/domain - it's usually at the end
                        if re.search(r'(?:https?://|\\b[a-zA-Z0-9][a-zA-Z0-9-]*\\.[a-zA-Z]{2,})', next_line):
                            i += 1
                            break
                        
                        # Stop if line doesn't end with backslash AND we have a URL already in the command
                        if not next_line.endswith('\\'):
                            full_command_so_far = ' '.join(command_lines)
                            if re.search(r'(?:https?://|localhost|127\.0\.0\.1)', full_command_so_far):
                                i += 1
                                break
                        
                        i += 1
                    
                    # Join all parts with space
                    full_command = ' '.join(command_lines)
                    curl_commands.append((line_number, full_command))
                    continue
                
                i += 1
        else:
            i += 1

    return curl_commands


def validate_curl_syntax(command):
    """Validate that a curl command has basic correct syntax."""
    # Check if it starts with curl
    if not command.strip().startswith('curl'):
        return False, "Command does not start with 'curl'"

    # Check for common curl options
    if not any(opt in command for opt in ['-X', '--request']):
        return False, "No HTTP method specified (-X)"

    # Check for URL - look for protocol, domain pattern, or localhost
    has_url = False
    if any(proto in command for proto in ['http://', 'https://']):
        has_url = True
    elif re.search(r'\\b[a-zA-Z0-9][a-zA-Z0-9-]*\\.[a-zA-Z]{2,}', command):  # Domain pattern
        has_url = True
    elif 'localhost' in command or '127.0.0.1' in command:
        has_url = True
    
    if not has_url:
        return False, "No valid URL or domain found"

    return True, "✅ Syntax valid"


def test_curl_commands(commands, dry_run=True, substitute_vars=None):
    """
    Test curl commands by validating syntax and optionally executing them.

    Args:
        commands: List of curl commands to test
        dry_run: If True, show what would be executed without running it
        substitute_vars: Dict of {placeholder: value} to replace in commands
                        e.g., {'{yourOktaDomain}': 'example.okta.com'}

    Returns:
        List of test results as dicts
    """
    results = []

    for i, cmd in enumerate(commands, 1):
        result = {
            'command_num': i,
            'syntax_valid': False,
            'syntax_message': '',
            'executed': False,
            'exit_code': None,
            'output': '',
            'error': ''
        }

        # Validate syntax
        is_valid, message = validate_curl_syntax(cmd)
        result['syntax_valid'] = is_valid
        result['syntax_message'] = message

        if not is_valid:
            results.append(result)
            continue

        # Substitute variables if provided
        test_cmd = cmd
        if substitute_vars:
            for placeholder, value in substitute_vars.items():
                test_cmd = test_cmd.replace(placeholder, value)

        # Execute or dry-run
        if not dry_run:
            try:
                process = subprocess.run(
                    test_cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                result['executed'] = True
                result['exit_code'] = process.returncode
                result['output'] = process.stdout[:500]  # Limit output
                result['error'] = process.stderr[:500]
            except subprocess.TimeoutExpired:
                result['error'] = "Command timed out after 10 seconds"
            except Exception as e:
                result['error'] = f"Execution failed: {str(e)}"
        else:
            result['executed'] = False
            result['output'] = f"[DRY RUN] Would execute:\n{test_cmd}"

        results.append(result)

    return results


def print_test_results(results, verbose=False):
    """Pretty-print test results."""
    print("\n" + "="*80)
    print("CURL COMMAND TEST RESULTS")
    print("="*80 + "\n")

    for result in results:
        print(f"Command #{result['command_num']}:")
        print(f"  Syntax Valid: {'✓ Yes' if result['syntax_valid'] else '✗ No'}")
        if not result['syntax_valid']:
            print(f"  Issue: {result['syntax_message']}")
        else:
            print(f"  Status: {result['syntax_message']}")

        if result['executed']:
            print(f"  Exit Code: {result['exit_code']}")
            if result['output']:
                print(f"  Output: {result['output']}")
            if result['error']:
                print(f"  Error: {result['error']}")
        else:
            if verbose or result['syntax_message'] != '✅ Syntax valid':
                print(f"  {result['output']}")

        print()

    # Summary
    valid_count = sum(1 for r in results if r['syntax_valid'])
    print("="*80)
    print(f"Summary: {valid_count}/{len(results)} commands have valid syntax")
    print("="*80)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Extract and test curl commands from markdown')
    parser.add_argument('file', nargs='?', help='Path to markdown file to analyze')
    parser.add_argument('--file', dest='file_arg', help='Path to markdown file to analyze (alternative to positional arg)')
    parser.add_argument('--test', action='store_true', help='Run syntax validation tests')
    parser.add_argument('--execute', action='store_true', help='Actually execute the curl commands (requires real credentials)')
    parser.add_argument('--domain', help='Okta domain to substitute (e.g., example.okta.com). Can also set OKTA_DOMAIN env var')
    parser.add_argument('--token', help='Bearer token to substitute. Can also set OKTA_TOKEN env var')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')

    args = parser.parse_args()

    # Determine which file argument to use
    md_file = args.file_arg or args.file

    if not md_file:
        parser.print_help()
        print("\n❌ Error: No markdown file specified")
        sys.exit(1)

    if not os.path.exists(md_file):
        print(f"❌ Error: File not found: {md_file}")
        sys.exit(1)

    commands_with_lines = extract_curl_commands(md_file)
    commands = [cmd for _, cmd in commands_with_lines]  # Extract just commands for testing

    print(f"📄 Analyzing: {md_file}")
    print(f"Found {len(commands)} curl command(s):\n")
    for i, (line_num, cmd) in enumerate(commands_with_lines, 1):
        print(f"--- Command {i} (Line {line_num}) ---")
        print(cmd)
        print()

    # Run tests if requested
    if args.test or args.execute:
        # Get values from command-line args or environment variables
        domain = args.domain or os.getenv('OKTA_DOMAIN')
        token = args.token or os.getenv('OKTA_TOKEN')

        # Basic syntax validation (no credentials needed)
        if args.test and not args.execute and not domain and not token:
            print("\n📋 Running basic syntax validation (no credentials needed)...")
            results = test_curl_commands(
                commands,
                dry_run=True,
                substitute_vars=None  # No substitution without credentials
            )
            print_test_results(results, verbose=args.verbose)
        else:
            # Variable substitution and execution (requires credentials)
            substitute_vars = {}

            if domain:
                substitute_vars['{yourOktaDomain}'] = domain
                print(f"✓ Using Okta domain: {domain}")
            else:
                print("⚠ No Okta domain provided. Use --domain or set OKTA_DOMAIN env var")

            if token:
                substitute_vars['{yourAccessToken}'] = token
                print(f"✓ Using access token")
            else:
                print("⚠ No access token provided. Use --token or set OKTA_TOKEN env var")

            if not domain or not token:
                print("\n⚠ Skipping tests due to missing credentials")
            else:
                results = test_curl_commands(
                    commands,
                    dry_run=not args.execute,
                    substitute_vars=substitute_vars if substitute_vars else None
                )
                print_test_results(results, verbose=args.verbose)
