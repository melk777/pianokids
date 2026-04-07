import os

file_path = "C:/Users/User/pianokids-1/tmp/lint_errors_raw.txt"
# Run eslint and redirect to a raw file
os.system(f'npx eslint "src/app/dashboard/play/[songId]/page.tsx" > {file_path}')

if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        print("--- ESLINT OUTPUT ---")
        print(content)
        print("--- END OUTPUT ---")
else:
    print("Lint log not found.")
