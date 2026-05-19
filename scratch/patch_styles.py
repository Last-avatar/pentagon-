import os
import glob
import re

files = glob.glob('frontend/src/**/*.jsx', recursive=True)

def replace_all(content, replacements):
    for old, new in replacements:
        content = re.sub(old, new, content)
    return content

replacements = [
    (r'"rgba\(10,\s*12,\s*16,\s*0\.8\)"', '"var(--bg-card)"'),
    (r'"rgba\(16,\s*20,\s*30,\s*0\.[67]\)"', '"var(--bg-card)"'),
    (r'"rgba\(0,\s*0,\s*0,\s*0\.[234]\)"', '"var(--bg-secondary)"'),
    (r'"rgba\(0,\s*0,\s*0,\s*0\.15\)"', '"var(--bg-secondary)"'),
    (r'"rgba\(255,\s*255,\s*255,\s*0\.0[234568]\)"', '"var(--border-color)"'),
    (r'"rgba\(255,\s*255,\s*255,\s*0\.1[25]\)"', '"var(--border-color)"'),
    (r'"#080c14"', '"var(--bg-primary)"'),
    (r'color:\s*"#fff"', 'color: "var(--text-primary)"'),
    (r'color:\s*\'#fff\'', 'color: "var(--text-primary)"'),
    (r'background:\s*"rgba\(255,\s*23,\s*68,\s*0\.15\)"', 'background: "#fef2f2"'),
    (r'background:\s*"rgba\(239,\s*68,\s*68,\s*0\.05\)"', 'background: "#fef2f2"'),
    (r'boxShadow:\s*"0\s*0\s*15px\s*rgba\(255,\s*23,\s*68,\s*0\.08\)"', 'boxShadow: "var(--shadow-sm)"'),
    (r'borderTop:\s*"1px\s*solid\s*rgba\(255,23,68,0\.15\)"', 'borderTop: "1px solid var(--border-color)"'),
    (r'borderTop:\s*"1px\s*solid\s*var\(--neon-red\)"', 'borderTop: "1px solid #fca5a5"'),
    (r'border:\s*"1px\s*solid\s*rgba\(255,193,7,0\.12\)"', 'border: "1px solid var(--border-color)"'),
    (r'boxShadow:\s*"0\s*4px\s*12px\s*rgba\(0,0,0,0\.15\)"', 'boxShadow: "var(--shadow-md)"'),
    (r'background:\s*"linear-gradient\(90deg, #fff 0%, var\(--neon-blue\) 100%\)"', 'background: "transparent", color: "var(--text-primary)"'),
    (r'WebkitBackgroundClip:\s*"text"', '/* WebkitBackgroundClip */'),
    (r'WebkitTextFillColor:\s*"transparent"', '/* WebkitTextFillColor */'),
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = replace_all(content, replacements)
    
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {fpath}")

print("Done")
