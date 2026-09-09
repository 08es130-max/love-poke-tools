from pathlib import Path

selector = Path('loveca-filter-selector.js')
text = selector.read_text(encoding='utf-8')
old = "{id:'heart',label:'ハート',selectors:['#lovecaHeart_pink_enabled']},"
new = "{id:'heart',label:'ハート',selectors:['.loveca-heart-matrix-label']},"
if old not in text:
    raise SystemExit('heart group selector pattern not found')
text = text.replace(old, new, 1)
selector.write_text(text, encoding='utf-8')

sw = Path('sw.js')
text = sw.read_text(encoding='utf-8')
old_cache = "v20260909-10"
new_cache = "v20260909-11"
if old_cache not in text:
    raise SystemExit('expected cache version not found')
sw.write_text(text.replace(old_cache, new_cache, 1), encoding='utf-8')

print('fixed heart filter group and bumped cache')
