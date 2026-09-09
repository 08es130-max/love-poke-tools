from pathlib import Path

js = Path('loveca-card-browser.js')
s = js.read_text(encoding='utf-8')

old = '''              <label><input id="lovecaBladeColor_pink" type="checkbox" value="桃">桃</label>
              <label><input id="lovecaBladeColor_red" type="checkbox" value="赤">赤</label>
              <label><input id="lovecaBladeColor_yellow" type="checkbox" value="黄">黄</label>
              <label><input id="lovecaBladeColor_green" type="checkbox" value="緑">緑</label>
              <label><input id="lovecaBladeColor_blue" type="checkbox" value="青">青</label>
              <label><input id="lovecaBladeColor_purple" type="checkbox" value="紫">紫</label>
            </div>'''
new = '''              <label><input id="lovecaBladeColor_pink" type="checkbox" value="pink">桃</label>
              <label><input id="lovecaBladeColor_red" type="checkbox" value="red">赤</label>
              <label><input id="lovecaBladeColor_yellow" type="checkbox" value="yellow">黄</label>
              <label><input id="lovecaBladeColor_green" type="checkbox" value="green">緑</label>
              <label><input id="lovecaBladeColor_blue" type="checkbox" value="blue">青</label>
              <label><input id="lovecaBladeColor_purple" type="checkbox" value="purple">紫</label>
              <label><input id="lovecaBladeColor_all" type="checkbox" value="all">ALL</label>
              <label><input id="lovecaBladeSpecial_draw" type="checkbox" value="draw">ドロー</label>
              <label><input id="lovecaBladeSpecial_note" type="checkbox" value="note">音符</label>
            </div>
            <span class="hint compact">複数選択した場合は、いずれかを持つカードを表示します。</span>'''
if old not in s:
    raise SystemExit('blade markup block not found')
s = s.replace(old, new, 1)

old = "...heartOrder.filter(([key])=>key!=='colorless').map(([key])=>`#lovecaBladeColor_${key}`)]"
new = "...heartOrder.filter(([key])=>key!=='colorless').map(([key])=>`#lovecaBladeColor_${key}`),'#lovecaBladeColor_all','#lovecaBladeSpecial_draw','#lovecaBladeSpecial_note']"
if old not in s:
    raise SystemExit('control binding marker not found')
s = s.replace(old, new, 1)

old = """      document.querySelector('#lovecaBladeFilter').value='all';
      document.querySelector('#lovecaSort').value='no-asc';"""
new = """      document.querySelector('#lovecaBladeFilter').value='all';
      ['#lovecaBladeColor_all','#lovecaBladeSpecial_draw','#lovecaBladeSpecial_note'].forEach(selector=>{const el=document.querySelector(selector);if(el)el.checked=false;});
      document.querySelector('#lovecaSort').value='no-asc';"""
if old not in s:
    raise SystemExit('clear marker not found')
s = s.replace(old, new, 1)

old = '''  function bladeCount(card){
    const candidates=[card.bladeHeart,card.attack];
    for(const value of candidates){
      const text=String(value??'').trim();
      if(!text||text==='-'||text==='0')continue;
      const nums=text.match(/\\d+/g);
      if(nums)return nums.map(Number).reduce((a,b)=>a+b,0);
      if(/blade|ブレード/i.test(text))return 1;
    }
    return 0;
  }'''
new = '''  function bladeHeartKinds(card){
    const kinds=new Set(Array.isArray(card.bladeHeartTypes)?card.bladeHeartTypes:[]);
    if(card.specialHeart==='draw')kinds.add('draw');
    if(card.specialHeart==='note')kinds.add('note');
    return kinds;
  }'''
if old not in s:
    raise SystemExit('bladeCount function not found')
s = s.replace(old, new, 1)

old = """    const bladeFilter=document.querySelector('#lovecaBladeFilter')?.value||'all';
    const bladeColors=new Set(heartOrder.filter(([key])=>key!=='colorless'&&document.querySelector(`#lovecaBladeColor_${key}`)?.checked).map(([,label])=>label));"""
new = """    const bladeFilter=document.querySelector('#lovecaBladeFilter')?.value||'all';
    const bladeKinds=new Set(heartOrder.filter(([key])=>key!=='colorless'&&document.querySelector(`#lovecaBladeColor_${key}`)?.checked).map(([key])=>key));
    if(document.querySelector('#lovecaBladeColor_all')?.checked)bladeKinds.add('all');
    if(document.querySelector('#lovecaBladeSpecial_draw')?.checked)bladeKinds.add('draw');
    if(document.querySelector('#lovecaBladeSpecial_note')?.checked)bladeKinds.add('note');"""
if old not in s:
    raise SystemExit('blade selection marker not found')
s = s.replace(old, new, 1)

old = '''      const hasBlade=bladeCount(card)>0;
      if(bladeFilter==='yes'&&!hasBlade)return false;
      if(bladeFilter==='no'&&hasBlade)return false;
      if(bladeColors.size){
        if(!hasBlade)return false;
        const bladeColor=String(card.bladeColor||card.color||'');
        if(!bladeColors.has(bladeColor))return false;
      }'''
new = '''      const cardBladeKinds=bladeHeartKinds(card);
      const hasBladeHeart=!!card.hasBladeHeart||cardBladeKinds.size>0;
      if(bladeFilter==='yes'&&!hasBladeHeart)return false;
      if(bladeFilter==='no'&&hasBladeHeart)return false;
      if(bladeKinds.size&&![...bladeKinds].some(kind=>cardBladeKinds.has(kind)))return false;'''
if old not in s:
    raise SystemExit('blade filter logic not found')
s = s.replace(old, new, 1)
js.write_text(s, encoding='utf-8')

selector = Path('loveca-filter-selector.js')
t = selector.read_text(encoding='utf-8')
old = "{id:'blade',label:'ブレード',selectors:['#lovecaBladeFilter']}"
new = "{id:'blade',label:'ブレードハート',selectors:['#lovecaBladeFilter']}"
if old not in t:
    raise SystemExit('selector group marker not found')
t = t.replace(old, new, 1)

old = """      ['pink','red','yellow','green','blue','purple'].forEach(key=>{const e=field(`#lovecaBladeColor_${key}`);if(e)e.checked=false;});
      bf?.dispatchEvent(new Event('change',{bubbles:true}));"""
new = """      ['pink','red','yellow','green','blue','purple','all'].forEach(key=>{const e=field(`#lovecaBladeColor_${key}`);if(e)e.checked=false;});
      ['draw','note'].forEach(key=>{const e=field(`#lovecaBladeSpecial_${key}`);if(e)e.checked=false;});
      bf?.dispatchEvent(new Event('change',{bubbles:true}));"""
if old not in t:
    raise SystemExit('selector clear block not found')
t = t.replace(old, new, 1)

old = "    if(group.id==='blade')return get('#lovecaBladeFilter')?.selectedOptions?.[0]?.textContent||'';"
new = """    if(group.id==='blade'){
      const parts=[];
      const mode=get('#lovecaBladeFilter')?.selectedOptions?.[0]?.textContent||'';
      if(mode&&mode!=='指定なし')parts.push(mode);
      const labels={pink:'桃',red:'赤',yellow:'黄',green:'緑',blue:'青',purple:'紫',all:'ALL'};
      Object.entries(labels).forEach(([key,label])=>{if(get(`#lovecaBladeColor_${key}`)?.checked)parts.push(label);});
      if(get('#lovecaBladeSpecial_draw')?.checked)parts.push('ドロー');
      if(get('#lovecaBladeSpecial_note')?.checked)parts.push('音符');
      return parts.join(' / ');
    }"""
if old not in t:
    raise SystemExit('selector blade value marker not found')
t = t.replace(old, new, 1)
selector.write_text(t, encoding='utf-8')

sw = Path('sw.js')
w = sw.read_text(encoding='utf-8')
import re
m = re.search(r'v20260909-(\d+)', w)
if not m:
    raise SystemExit('service worker cache version not found')
next_version = int(m.group(1)) + 1
w = w[:m.start()] + f'v20260909-{next_version}' + w[m.end():]
sw.write_text(w, encoding='utf-8')

print('patched blade-heart search semantics')
