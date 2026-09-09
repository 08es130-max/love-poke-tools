from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

index_path=ROOT/'index.html'
index=index_path.read_text(encoding='utf-8')
script_tag='  <script src="./loveca-card-browser.js"></script>\n'
if 'src="./loveca-card-browser.js"' not in index:
    if '</body>' not in index:
        raise SystemExit('index.html: </body> not found; refusing to patch')
    index=index.replace('</body>',script_tag+'</body>',1)
    index_path.write_text(index,encoding='utf-8')
    print('patched index.html')
else:
    print('index.html already contains LoveCa browser script')

sw_path=ROOT/'sw.js'
sw=sw_path.read_text(encoding='utf-8')
for asset,anchor in [
    ("  './loveca-card-browser.js',\n","  './pokemon-ui.js',\n"),
    ("  './loveca-card-browser.css',\n","  './loveca-card-browser.js',\n"),
    ("  './loveca-cards.json',\n","  './loveca-card-browser.css',\n"),
]:
    if asset.strip() not in sw:
        if anchor not in sw:
            raise SystemExit(f'sw.js: anchor not found for {asset.strip()}; refusing to patch')
        sw=sw.replace(anchor,anchor+asset,1)

match=re.search(r"const CACHE_NAME = `\$\{CACHE_PREFIX\}v(\d{8})-(\d+)`;",sw)
if not match:
    raise SystemExit('sw.js: cache version pattern not found; refusing to patch')
version_date=match.group(1)
version_no=int(match.group(2))+1
sw=re.sub(
    r"const CACHE_NAME = `\$\{CACHE_PREFIX\}v\d{8}-\d+`;",
    f"const CACHE_NAME = `${{CACHE_PREFIX}}v{version_date}-{version_no}`;",
    sw,
    count=1,
)
sw_path.write_text(sw,encoding='utf-8')
print(f'patched sw.js -> v{version_date}-{version_no}')
