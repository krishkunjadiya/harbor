import os
import re

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Skip binary files
        return

    original_content = content
    
    # Replace branding
    content = content.replace('Reactive Resume', 'Harbor Resume')
    
    # Replace URL/domain
    content = content.replace('rxresu.me', 'harbor.dev')
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")

def main():
    root_dir = r'E:\KRISH(PPSU)\Semester 6\Major Project\Harbor\reactive_resume'
    skip_files = ['README.md', 'LICENSE']
    
    for root, dirs, files in os.walk(root_dir):
        # Skip .git directory
        if '.git' in dirs:
            dirs.remove('.git')
        if '.next' in dirs:
            dirs.remove('.next')
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
            
        for file in files:
            if file in skip_files:
                continue
                
            file_path = os.path.join(root, file)
            replace_in_file(file_path)

if __name__ == "__main__":
    main()
