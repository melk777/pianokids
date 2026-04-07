import json
import subprocess
import os

def get_lint_errors():
    try:
        # Run eslint and get JSON output
        result = subprocess.run(['npx', 'eslint', 'src', '--format', 'json'], capture_output=True, text=True)
        if not result.stdout:
            print("No eslint output")
            return
            
        data = json.loads(result.stdout)
        
        errors_found = 0
        for file_entry in data:
            file_path = file_entry.get('filePath', 'unknown')
            messages = file_entry.get('messages', [])
            
            for msg in messages:
                # Severity 2 is ERROR
                if msg.get('severity') == 2:
                    line = msg.get('line', 0)
                    col = msg.get('column', 0)
                    message = msg.get('message', '')
                    rule = msg.get('ruleId', 'none')
                    
                    print(f"FILE: {file_path}")
                    print(f"L{line}:C{col} [{rule}] -> {message}")
                    print("-" * 40)
                    errors_found += 1
        
        print(f"\nTotal Errors Found: {errors_found}")
        
    except Exception as e:
        print(f"Error during lint diagnosis: {e}")

if __name__ == "__main__":
    get_lint_errors()
