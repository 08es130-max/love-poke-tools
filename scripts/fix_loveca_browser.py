from pathlib import Path

path=Path(__file__).resolve().parents[1]/'loveca-card-browser.js'
text=path.read_text(encoding='utf-8')

old='''              <option value="member">メンバー</option>\n              <option value="live">ライブ</option>'''
new='''              <option value="member">メンバー</option>\n              <option value="live">ライブ</option>\n              <option value="energy">エネルギー</option>'''
if old in text:
    text=text.replace(old,new,1)
elif '<option value="energy">エネルギー</option>' not in text:
    raise SystemExit('card type options anchor not found; refusing to patch')

old='''      if(type==='live'&&!card.isLive)return false;\n      if(type==='member'&&card.isLive)return false;'''
new='''      const cardType=String(card.cardType||'');\n      if(type==='live'&&!card.isLive)return false;\n      if(type==='member'&&cardType!=='メンバー')return false;\n      if(type==='energy'&&cardType!=='エネルギー')return false;'''
if old in text:
    text=text.replace(old,new,1)
elif "if(type==='energy'&&cardType!=='エネルギー')return false;" not in text:
    raise SystemExit('card type filter anchor not found; refusing to patch')

old='''      const observer=new MutationObserver(()=>{\n        if(!favoriteSyncing&&loaded)queueMicrotask(syncFavoriteOptions);\n      });'''
new='''      const observer=new MutationObserver(()=>{\n        if(favoriteSyncing||!loaded)return;\n        const needsFavorites=favoriteLiveCards().length>0;\n        const hasGroup=!!select.querySelector('optgroup[data-loveca-favorites]');\n        if(needsFavorites&&!hasGroup)queueMicrotask(syncFavoriteOptions);\n      });'''
if old in text:
    text=text.replace(old,new,1)
elif 'const needsFavorites=favoriteLiveCards().length>0;' not in text:
    raise SystemExit('favorite observer anchor not found; refusing to patch')

path.write_text(text,encoding='utf-8')
print('LoveCa browser safety fixes applied')
