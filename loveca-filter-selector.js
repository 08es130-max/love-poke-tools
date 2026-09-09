(()=>{
  const GROUPS=[
    {id:'type',label:'カードタイプ',selectors:['#lovecaTypeFilter']},
    {id:'work',label:'作品名',selectors:['#lovecaWorkFilter']},
    {id:'cost',label:'コスト',selectors:['#lovecaCostMin','#lovecaCostMax']},
    {id:'score',label:'ライブスコア',selectors:['#lovecaScoreMin','#lovecaScoreMax']},
    {id:'heart',label:'ハート',selectors:['#lovecaHeart_pink_enabled']},
    {id:'blade',label:'ブレード',selectors:['#lovecaBladeFilter']},
    {id:'color',label:'色',selectors:['#lovecaColorFilter']},
    {id:'rarity',label:'レアリティ',selectors:['#lovecaRarityFilter']},
    {id:'expansion',label:'収録商品',selectors:['#lovecaExpansionFilter']},
    {id:'sort',label:'並び順',selectors:['#lovecaSort']},
    {id:'favorite',label:'お気に入り',selectors:['#lovecaFavoritesOnly']},
  ];
  const STORAGE_KEY='lovepoke_loveca_visible_filters_v1';

  function readSelected(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return new Set(Array.isArray(value)?value:[]);
    }catch{return new Set()}
  }
  function saveSelected(set){localStorage.setItem(STORAGE_KEY,JSON.stringify([...set]));}
  function field(selector){return document.querySelector(selector)}
  function labelFor(selector){return field(selector)?.closest('label')||null}

  function clearGroup(group){
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
    for(const selector of group.selectors){
      const el=field(selector);if(!el)continue;
      if(el.type==='checkbox')el.checked=false;
      else if(el.tagName==='SELECT'){
        if(selector==='#lovecaTypeFilter'||selector==='#lovecaBladeFilter')el.value=el.querySelector('option[value="all"]')?'all':'';
        else if(selector==='#lovecaSort')el.value='no-asc';
        else el.value='';
      }else el.value='';
      el.dispatchEvent(new Event(el.tagName==='SELECT'||el.type==='checkbox'?'change':'input',{bubbles:true}));
    }
  }

  function valueText(group){
    const get=s=>field(s);
    if(group.id==='type')return get('#lovecaTypeFilter')?.selectedOptions?.[0]?.textContent||'';
    if(group.id==='work')return get('#lovecaWorkFilter')?.value||'';
    if(group.id==='color')return get('#lovecaColorFilter')?.value||'';
    if(group.id==='rarity')return get('#lovecaRarityFilter')?.value||'';
    if(group.id==='expansion')return get('#lovecaExpansionFilter')?.value||'';
    if(group.id==='blade')return get('#lovecaBladeFilter')?.selectedOptions?.[0]?.textContent||'';
    if(group.id==='sort')return get('#lovecaSort')?.selectedOptions?.[0]?.textContent||'';
    if(group.id==='favorite')return get('#lovecaFavoritesOnly')?.checked?'お気に入りのみ':'';
    if(group.id==='cost'||group.id==='score'){
      const p=group.id==='cost'?'Cost':'Score';
      const min=get(`#loveca${p}Min`)?.value||'';
      const max=get(`#loveca${p}Max`)?.value||'';
      return min||max?`${min||'－'}～${max||'－'}`:'';
    }
    if(group.id==='heart'){
      const labels={pink:'桃',red:'赤',yellow:'黄',green:'緑',blue:'青',purple:'紫',colorless:'無'};
      return Object.entries(labels).map(([key,label])=>{
        const enabled=get(`#lovecaHeart_${key}_enabled`)?.checked;
        const min=get(`#lovecaHeart_${key}_min`)?.value||'';
        const max=get(`#lovecaHeart_${key}_max`)?.value||'';
        if(!enabled&&!min&&!max)return'';
        return `${label}${min||'1'}～${max||'－'}`;
      }).filter(Boolean).join(' / ');
    }
    return '';
  }

  function init(){
    const grid=document.querySelector('.loveca-filter-grid');
    if(!grid||document.querySelector('#lovecaFilterPicker'))return;

    const selected=readSelected();
    const head=document.querySelector('.loveca-browser-head');
    const compact=document.createElement('div');
    compact.className='loveca-filter-compact';
    compact.innerHTML=`
      <div class="loveca-filter-actions">
        <button id="lovecaOpenFilterPicker" type="button" class="primary-btn">＋ 検索条件を追加・変更</button>
        <span id="lovecaSelectedFilterCount" class="badge soft"></span>
      </div>
      <div id="lovecaFilterChips" class="loveca-filter-chips"></div>
      <div id="lovecaSelectedFilterGrid" class="loveca-selected-filter-grid"></div>`;
    grid.before(compact);

    const selectedGrid=compact.querySelector('#lovecaSelectedFilterGrid');
    for(const group of GROUPS){
      const labels=[...new Set(group.selectors.map(labelFor).filter(Boolean))];
      for(const label of labels){label.dataset.filterGroup=group.id;selectedGrid.append(label);}
    }
    grid.remove();

    const dialog=document.createElement('dialog');
    dialog.id='lovecaFilterPicker';
    dialog.className='loveca-filter-dialog';
    dialog.innerHTML=`<form method="dialog" class="loveca-filter-dialog-card">
      <div class="section-title-row"><div><h2>検索条件を選ぶ</h2><p class="hint compact">使う条件だけ検索画面に表示します。</p></div><button value="cancel" class="ghost-btn">閉じる</button></div>
      <div class="loveca-filter-choice-grid">${GROUPS.map(g=>`<label><input type="checkbox" data-choice="${g.id}"> <span>${g.label}</span></label>`).join('')}</div>
      <div class="loveca-filter-dialog-actions"><button id="lovecaApplyFilterChoices" type="button" class="primary-btn">この条件で検索する</button></div>
    </form>`;
    document.body.append(dialog);

    function render(){
      for(const group of GROUPS){
        selectedGrid.querySelectorAll(`[data-filter-group="${group.id}"]`).forEach(el=>el.classList.toggle('hidden',!selected.has(group.id)));
        const checkbox=dialog.querySelector(`[data-choice="${group.id}"]`);if(checkbox)checkbox.checked=selected.has(group.id);
      }
      compact.querySelector('#lovecaSelectedFilterCount').textContent=selected.size?`${selected.size}条件`:'条件なし';
      const chips=compact.querySelector('#lovecaFilterChips');
      chips.innerHTML=[...selected].map(id=>{
        const group=GROUPS.find(g=>g.id===id);if(!group)return'';
        const value=valueText(group);
        return `<button type="button" class="loveca-filter-chip" data-chip="${id}"><span>${group.label}${value?`：${escapeHtml(value)}`:''}</span><b>×</b></button>`;
      }).join('');
      chips.querySelectorAll('[data-chip]').forEach(btn=>btn.addEventListener('click',()=>{
        const group=GROUPS.find(g=>g.id===btn.dataset.chip);if(!group)return;
        selected.delete(group.id);clearGroup(group);saveSelected(selected);render();
      }));
    }

    document.querySelector('#lovecaOpenFilterPicker')?.addEventListener('click',()=>dialog.showModal());
    dialog.querySelector('#lovecaApplyFilterChoices')?.addEventListener('click',()=>{
      const next=new Set([...dialog.querySelectorAll('[data-choice]:checked')].map(x=>x.dataset.choice));
      for(const group of GROUPS){if(selected.has(group.id)&&!next.has(group.id))clearGroup(group);}
      selected.clear();next.forEach(x=>selected.add(x));saveSelected(selected);render();dialog.close();
    });
    selectedGrid.addEventListener('input',()=>queueMicrotask(render));
    selectedGrid.addEventListener('change',()=>queueMicrotask(render));
    document.querySelector('#lovecaClearFilters')?.addEventListener('click',()=>queueMicrotask(render));
    render();
  }

  function escapeHtml(value=''){
    return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
