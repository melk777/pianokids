import json
import subprocess
import sys

def get_lint_errors():
    try:
        # Run eslint and get JSON output
        result = subprocess.run(['npx', 'eslint', 'src', '--format', 'json'], capture_output=True, text=True)
        if not result.stdout:
            print("No eslint output")
            return
            
        data = json.loads(result.stdout)
        
        for file_entry in data:
            file_path = file_entry.get('filePath', 'unknown')
            messages = file_entry.get('messages', [])
            
            # Filter for errors only
            errors = [m for m in messages if m.get('severity') == 2]
            if not errors:
                continue
                
            print(f"FILE: {file_path}")
            for msg in errors:
                line = msg.get('line', 0)
                col = msg.get('column', 0)
                message = msg.get('message', '')
                rule = msg.get('ruleId', 'none')
                print(f"  L{line}:C{col} [{rule}] -> {message}")
            print("-" * 20)
        
    except Exception as e:
        print(f"Error during lint diagnosis: {e}")

if __name__ == "__main__":
    get_lint_errors()
