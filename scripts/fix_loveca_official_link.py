from pathlib import Path

browser = Path('loveca-card-browser.js')
text = browser.read_text(encoding='utf-8')
old = '${card.detailUrl?`<a class="ghost-btn loveca-official-link" href="${esc(card.detailUrl)}" target="_blank" rel="noopener">公式詳細</a>`:\'\'}'
new = '<a class="ghost-btn loveca-official-link" href="https://llofficial-cardgame.com/cardlist/" target="_blank" rel="noopener">公式カードリスト</a>'
if old not in text:
    raise SystemExit('official detail link snippet not found')
text = text.replace(old, new, 1)
browser.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
old_cache = "v20260909-11"
new_cache = "v20260909-12"
if old_cache not in sw_text:
    raise SystemExit('expected cache version not found')
sw.write_text(sw_text.replace(old_cache, new_cache, 1), encoding='utf-8')
