import json
import subprocess
import os

def run():
    print("Running ESLint...")
    try:
        proc = subprocess.run('npx eslint src --format json', shell=True, capture_output=True)
        if not proc.stdout:
            print("No output from ESLint")
            return
            
        data = json.loads(proc.stdout.decode('utf-8', errors='ignore'))
        
        for file_data in data:
            file_path = file_data.get('filePath', '')
            base_name = os.path.basename(file_path)
            errors = [m for m in file_data.get('messages', []) if m.get('severity') == 2]
            
            if errors:
                print(f"\n[FILE] {base_name} ({file_path})")
                for err in errors:
                    print(f"  L{err.get('line')}:C{err.get('column')} [{err.get('ruleId')}] -> {err.get('message')}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
