from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')
marker = '  <script src="./loveca-filter-selector.js"></script>\n'
script = '  <script src="./mascot.js"></script>\n'
if script not in text:
    if marker not in text:
        raise SystemExit('index marker not found')
    text = text.replace(marker, marker + script, 1)
    index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
s = sw.read_text(encoding='utf-8')
if "  './mascot.js'," not in s:
    marker = "  './loveca-card-browser.css',\n"
    if marker not in s:
        raise SystemExit('sw asset marker not found')
    s = s.replace(marker, marker + "  './mascot.js',\n  './mascot.css',\n", 1)

import re
m = re.search(r"v(\d{8})-(\d+)", s)
if m:
    new_version = int(m.group(2)) + 1
    s = s[:m.start()] + f"v{m.group(1)}-{new_version}" + s[m.end():]
else:
    raise SystemExit('cache version not found')
sw.write_text(s, encoding='utf-8')
