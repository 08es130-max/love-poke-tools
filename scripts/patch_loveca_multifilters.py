from pathlib import Path
import re

js=Path('loveca-card-browser.js')
s=js.read_text(encoding='utf-8')

old='''          <label>ハート種類
            <select id="lovecaHeartType">
              <option value="">指定なし</option>
              <option value="pink">桃</option>
              <option value="red">赤</option>
              <option value="yellow">黄</option>
              <option value="green">緑</option>
              <option value="blue">青</option>
              <option value="purple">紫</option>
              <option value="colorless">無色</option>
            </select>
          </label>
          <label>ハート数 下限
            <input id="lovecaHeartMin" type="number" inputmode="numeric" min="0" placeholder="例 2">
          </label>
          <label>ハート数 上限
            <input id="lovecaHeartMax" type="number" inputmode="numeric" min="0" placeholder="例 4">
          </label>
          <label>ブレード
            <select id="lovecaBladeFilter">
              <option value="all">指定なし</option>
              <option value="yes">あり</option>
              <option value="no">なし</option>
            </select>
          </label>'''
new='''          <label class="loveca-heart-matrix-label">ハート（複数色をAND検索）
            <div id="lovecaHeartMatrix" class="loveca-heart-filter-matrix">
              ${heartOrder.map(([key,label])=>`<div class="loveca-heart-filter-row">
                <label class="loveca-heart-enable"><input id="lovecaHeart_${key}_enabled" type="checkbox"> <span>${label}</span></label>
                <input id="lovecaHeart_${key}_min" type="number" inputmode="numeric" min="0" placeholder="下限">
                <span>～</span>
                <input id="lovecaHeart_${key}_max" type="number" inputmode="numeric" min="0" placeholder="上限">
              </div>`).join('')}
            </div>
            <span class="hint compact">例：緑 2～4 と 青 1～2 → 両方を満たすカードだけ表示</span>
          </label>
          <label class="loveca-blade-color-label">ブレードハート
            <select id="lovecaBladeFilter">
              <option value="all">指定なし</option>
              <option value="yes">あり</option>
              <option value="no">なし</option>
            </select>
            <div id="lovecaBladeColors" class="loveca-blade-color-grid">
              <label><input id="lovecaBladeColor_pink" type="checkbox" value="桃">桃</label>
              <label><input id="lovecaBladeColor_red" type="checkbox" value="赤">赤</label>
              <label><input id="lovecaBladeColor_yellow" type="checkbox" value="黄">黄</label>
              <label><input id="lovecaBladeColor_green" type="checkbox" value="緑">緑</label>
              <label><input id="lovecaBladeColor_blue" type="checkbox" value="青">青</label>
              <label><input id="lovecaBladeColor_purple" type="checkbox" value="紫">紫</label>
            </div>
          </label>'''
if old not in s: raise SystemExit('markup anchor not found')
s=s.replace(old,new,1)

old_list="['#lovecaQuery','#lovecaTypeFilter','#lovecaWorkFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartType','#lovecaHeartMin','#lovecaHeartMax','#lovecaBladeFilter','#lovecaSort','#lovecaFavoritesOnly']"
new_list="['#lovecaQuery','#lovecaTypeFilter','#lovecaWorkFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaBladeFilter','#lovecaSort','#lovecaFavoritesOnly',...heartOrder.flatMap(([key])=>[`#lovecaHeart_${key}_enabled`,`#lovecaHeart_${key}_min`,`#lovecaHeart_${key}_max`]),...heartOrder.filter(([key])=>key!=='colorless').map(([key])=>`#lovecaBladeColor_${key}`)]"
if old_list not in s: raise SystemExit('bind anchor not found')
s=s.replace(old_list,new_list,1)
s=s.replace("['#lovecaQuery','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartMin','#lovecaHeartMax'].includes(selector)?'input':'change'", "['#lovecaQuery','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax'].includes(selector)||selector.includes('_min')||selector.includes('_max')?'input':'change'",1)

old_clear="""      document.querySelector('#lovecaHeartType').value='';
      document.querySelector('#lovecaHeartMin').value='';
      document.querySelector('#lovecaHeartMax').value='';
      document.querySelector('#lovecaBladeFilter').value='all';"""
new_clear="""      for(const [key] of heartOrder){
        const enabled=document.querySelector(`#lovecaHeart_${key}_enabled`);if(enabled)enabled.checked=false;
        const min=document.querySelector(`#lovecaHeart_${key}_min`);if(min)min.value='';
        const max=document.querySelector(`#lovecaHeart_${key}_max`);if(max)max.value='';
        const blade=document.querySelector(`#lovecaBladeColor_${key}`);if(blade)blade.checked=false;
      }
      document.querySelector('#lovecaBladeFilter').value='all';"""
if old_clear not in s: raise SystemExit('clear anchor not found')
s=s.replace(old_clear,new_clear,1)

old_vars="""    const heartType=document.querySelector('#lovecaHeartType')?.value||'';
    const heartMin=numberOrNull(document.querySelector('#lovecaHeartMin')?.value);
    const heartMax=numberOrNull(document.querySelector('#lovecaHeartMax')?.value);
    const bladeFilter=document.querySelector('#lovecaBladeFilter')?.value||'all';"""
new_vars="""    const heartFilters=heartOrder.map(([key,label])=>({
      key,label,
      enabled:!!document.querySelector(`#lovecaHeart_${key}_enabled`)?.checked,
      min:numberOrNull(document.querySelector(`#lovecaHeart_${key}_min`)?.value),
      max:numberOrNull(document.querySelector(`#lovecaHeart_${key}_max`)?.value)
    })).filter(x=>x.enabled||x.min!==null||x.max!==null);
    const bladeFilter=document.querySelector('#lovecaBladeFilter')?.value||'all';
    const bladeColors=new Set(heartOrder.filter(([key])=>key!=='colorless'&&document.querySelector(`#lovecaBladeColor_${key}`)?.checked).map(([,label])=>label));"""
if old_vars not in s: raise SystemExit('vars anchor not found')
s=s.replace(old_vars,new_vars,1)

old_logic="""      if(heartType){
        const heartCount=Number(card.hearts?.[heartType])||0;
        const effectiveMin=heartMin===null?1:heartMin;
        if(heartCount<effectiveMin)return false;
        if(heartMax!==null&&heartCount>heartMax)return false;
      }else if(heartMin!==null||heartMax!==null){
        const values=Object.values(card.hearts||{}).map(Number).filter(Number.isFinite);
        const matches=values.some(value=>(heartMin===null||value>=heartMin)&&(heartMax===null||value<=heartMax));
        if(!matches)return false;
      }

      const hasBlade=bladeCount(card)>0;
      if(bladeFilter==='yes'&&!hasBlade)return false;
      if(bladeFilter==='no'&&hasBlade)return false;"""
new_logic="""      for(const hf of heartFilters){
        const heartCount=Number(card.hearts?.[hf.key])||0;
        const effectiveMin=hf.min===null?1:hf.min;
        if(heartCount<effectiveMin)return false;
        if(hf.max!==null&&heartCount>hf.max)return false;
      }

      const hasBlade=bladeCount(card)>0;
      if(bladeFilter==='yes'&&!hasBlade)return false;
      if(bladeFilter==='no'&&hasBlade)return false;
      if(bladeColors.size){
        if(!hasBlade)return false;
        const bladeColor=String(card.bladeColor||card.color||'');
        if(!bladeColors.has(bladeColor))return false;
      }"""
if old_logic not in s: raise SystemExit('logic anchor not found')
s=s.replace(old_logic,new_logic,1)
js.write_text(s,encoding='utf-8')

selector=Path('loveca-filter-selector.js')
q=selector.read_text(encoding='utf-8')
q=q.replace("{id:'heart',label:'ハート',selectors:['#lovecaHeartType','#lovecaHeartMin','#lovecaHeartMax']},", "{id:'heart',label:'ハート',selectors:['#lovecaHeart_pink_enabled']},")
old="""    if(group.id==='heart'){
      const type=get('#lovecaHeartType')?.selectedOptions?.[0]?.textContent||'';
      const min=get('#lovecaHeartMin')?.value||'';
      const max=get('#lovecaHeartMax')?.value||'';
      const range=min||max?`${min||'－'}～${max||'－'}`:'';
      return [type==='指定なし'?'':type,range].filter(Boolean).join(' ');
    }"""
new="""    if(group.id==='heart'){
      const labels={pink:'桃',red:'赤',yellow:'黄',green:'緑',blue:'青',purple:'紫',colorless:'無'};
      return Object.entries(labels).map(([key,label])=>{
        const enabled=get(`#lovecaHeart_${key}_enabled`)?.checked;
        const min=get(`#lovecaHeart_${key}_min`)?.value||'';
        const max=get(`#lovecaHeart_${key}_max`)?.value||'';
        if(!enabled&&!min&&!max)return'';
        return `${label}${min||'1'}～${max||'－'}`;
      }).filter(Boolean).join(' / ');
    }"""
if old in q:q=q.replace(old,new,1)
old="""  function clearGroup(group){
    for(const selector of group.selectors){"""
new="""  function clearGroup(group){
    if(group.id==='heart'){
      ['pink','red','yellow','green','blue','purple','colorless'].forEach(key=>{
        const e=field(`#lovecaHeart_${key}_enabled`);if(e)e.checked=false;
        const min=field(`#lovecaHeart_${key}_min`);if(min)min.value='';
        const max=field(`#lovecaHeart_${key}_max`);if(max)max.value='';
      });
      field('#lovecaHeart_pink_enabled')?.dispatchEvent(new Event('change',{bubbles:true}));
      return;
    }
    if(group.id==='blade'){
      const bf=field('#lovecaBladeFilter');if(bf)bf.value='all';
      ['pink','red','yellow','green','blue','purple'].forEach(key=>{const e=field(`#lovecaBladeColor_${key}`);if(e)e.checked=false;});
      bf?.dispatchEvent(new Event('change',{bubbles:true}));
      return;
    }
    for(const selector of group.selectors){"""
if old not in q: raise SystemExit('selector clear anchor not found')
q=q.replace(old,new,1)
selector.write_text(q,encoding='utf-8')

css=Path('loveca-card-browser.css')
c=css.read_text(encoding='utf-8')
extra='''\n.loveca-heart-filter-matrix{display:grid;gap:7px;margin-top:7px}\n.loveca-heart-filter-row{display:grid;grid-template-columns:64px minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center}\n.loveca-heart-filter-row input[type="number"]{min-width:0}\n.loveca-heart-enable{display:flex!important;flex-direction:row!important;align-items:center;gap:5px!important;font-weight:800!important}\n.loveca-heart-enable input{width:18px!important;height:18px!important}\n.loveca-blade-color-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}\n.loveca-blade-color-grid label{display:flex!important;flex-direction:row!important;align-items:center;gap:5px!important;padding:7px 8px;border:1px solid #e4dde1;border-radius:9px;background:#fff}\n.loveca-blade-color-grid input{width:18px!important;height:18px!important}\n@media (max-width:480px){.loveca-heart-filter-row{grid-template-columns:58px minmax(0,1fr) auto minmax(0,1fr)}.loveca-blade-color-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}\n'''
if '.loveca-heart-filter-matrix{' not in c:c+=extra
css.write_text(c,encoding='utf-8')

py=Path('scripts/update_loveca_cards.py')
p=py.read_text(encoding='utf-8')
marker='''        "color": clean_value(raw.get("color")),
        "power": clean_value(raw.get("power")),'''
repl='''        "color": clean_value(raw.get("color")),
        "bladeColor": clean_value(raw.get("color")) if not live else "",
        "power": clean_value(raw.get("power")),'''
if marker in p and '"bladeColor"' not in p:p=p.replace(marker,repl,1)
py.write_text(p,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
w=re.sub(r"v20260909-\d+",'v20260909-8',w,count=1)
sw.write_text(w,encoding='utf-8')
