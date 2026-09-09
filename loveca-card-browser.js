(()=>{
  const FAVORITES_KEY='lovepoke_loveca_favorite_lives';
  const PAGE_SIZE=60;
  const heartOrder=[
    ['pink','桃'],['red','赤'],['yellow','黄'],['green','緑'],['blue','青'],['purple','紫'],['colorless','無']
  ];
  let cards=[];
  let filtered=[];
  let visibleCount=PAGE_SIZE;
  let loaded=false;
  let loading=null;
  let favoriteSyncing=false;

  function esc(value=''){
    return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function favorites(){
    try{
      const value=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');
      return new Set(Array.isArray(value)?value.map(String):[]);
    }catch{return new Set()}
  }
  function saveFavorites(set){
    localStorage.setItem(FAVORITES_KEY,JSON.stringify([...set]));
  }
  function cardById(id){return cards.find(card=>String(card.id)===String(id))||null}
  function isFavorite(card){return favorites().has(String(card.id))}

  function ensureCss(){
    if(document.querySelector('link[data-loveca-browser-css]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='./loveca-card-browser.css';
    link.dataset.lovecaBrowserCss='1';
    document.head.append(link);
  }

  function setupLoveTabs(){
    const love=document.querySelector('#loveScreen');
    if(!love||document.querySelector('#loveCardBrowserPane'))return;

    const existing=Array.from(love.childNodes);
    const nav=document.createElement('nav');
    nav.className='love-subnav';
    nav.setAttribute('aria-label','ラブカ機能');
    nav.innerHTML=`
      <button type="button" class="love-tab active" data-love-pane="calc">対戦</button>
      <button type="button" class="love-tab" data-love-pane="cards">カード検索</button>`;

    const calc=document.createElement('div');
    calc.id='loveCalcPane';
    calc.className='love-pane';
    existing.forEach(node=>calc.append(node));

    const browser=document.createElement('div');
    browser.id='loveCardBrowserPane';
    browser.className='love-pane hidden';
    browser.innerHTML=browserMarkup();

    love.append(nav,calc,browser);
    nav.querySelectorAll('.love-tab').forEach(button=>button.addEventListener('click',async()=>{
      const pane=button.dataset.lovePane;
      nav.querySelectorAll('.love-tab').forEach(x=>x.classList.toggle('active',x===button));
      calc.classList.toggle('hidden',pane!=='calc');
      browser.classList.toggle('hidden',pane!=='cards');
      const title=document.querySelector('#appTitle');
      if(title)title.textContent=pane==='cards'?'ラブカ カード検索':'ラブカ ハート計算';
      const reset=document.querySelector('#resetAllBtn');
      if(reset)reset.style.display=pane==='cards'?'none':'inline-block';
      if(pane==='cards')await loadCards();
    }));

    document.querySelector('#navLove')?.addEventListener('click',()=>{
      const active=nav.querySelector('.love-tab.active')?.dataset.lovePane;
      const title=document.querySelector('#appTitle');
      if(title)title.textContent=active==='cards'?'ラブカ カード検索':'ラブカ ハート計算';
      const reset=document.querySelector('#resetAllBtn');
      if(reset)reset.style.display=active==='cards'?'none':'inline-block';
    });

    bindBrowserControls();
  }

  function browserMarkup(){
    return `
      <section class="panel loveca-browser-head">
        <div class="section-title-row">
          <div>
            <h2>ラブカ カード検索</h2>
            <p class="hint compact">公式カードリストを元にしたLovePoke Tools内の検索です。</p>
          </div>
          <span id="lovecaDbStatus" class="badge">読込前</span>
        </div>
        <div class="loveca-search-row">
          <textarea id="lovecaQuery" rows="1" inputmode="text" lang="ja" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="カード名・カード番号・効果などを検索"></textarea>
          <button id="lovecaClearFilters" type="button" class="ghost-btn">条件クリア</button>
        </div>
        <div class="loveca-filter-grid">
          <label>カードタイプ
            <select id="lovecaTypeFilter">
              <option value="all">すべて</option>
              <option value="member">メンバー</option>
              <option value="live">ライブ</option>
              <option value="energy">エネルギー</option>
            </select>
          </label>
          <label>色
            <select id="lovecaColorFilter"><option value="">すべて</option></select>
          </label>
          <label>レアリティ
            <select id="lovecaRarityFilter"><option value="">すべて</option></select>
          </label>
          <label>収録商品
            <select id="lovecaExpansionFilter"><option value="">すべて</option></select>
          </label>
          <label>並び順
            <select id="lovecaSort">
              <option value="no-asc">カード番号 昇順</option>
              <option value="no-desc">カード番号 降順</option>
              <option value="name">カード名</option>
            </select>
          </label>
          <label class="loveca-check-row"><span>☆お気に入りライブのみ</span><input id="lovecaFavoritesOnly" type="checkbox"></label>
        </div>
      </section>
      <section class="panel loveca-results-panel">
        <div class="section-title-row">
          <h2>検索結果</h2>
          <span id="lovecaResultCount" class="badge soft">—</span>
        </div>
        <div id="lovecaCardResults" class="loveca-card-grid">
          <p class="note">「カード検索」を開くとデータを読み込みます。</p>
        </div>
        <button id="lovecaLoadMore" type="button" class="wide-btn hidden">さらに表示</button>
      </section>`;
  }

  async function loadCards(){
    if(loaded)return;
    if(loading)return loading;
    const badge=document.querySelector('#lovecaDbStatus');
    if(badge){badge.textContent='読込中';badge.className='badge warn'}
    loading=(async()=>{
      try{
        const response=await fetch('./loveca-cards.json',{cache:'no-store'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const data=await response.json();
        cards=Array.isArray(data.cards)?data.cards:[];
        if(!cards.length)throw new Error('カードデータが空です');
        loaded=true;
        populateFilters();
        applyFilters();
        syncFavoriteOptions();
        if(badge){badge.textContent=`${cards.length.toLocaleString()}枚`;badge.className='badge ok'}
        const date=data.updatedAt?new Date(data.updatedAt):null;
        const hint=document.querySelector('.loveca-browser-head .hint');
        if(hint&&date&&!Number.isNaN(date.valueOf())){
          hint.textContent=`公式カードリストを元にしたLovePoke Tools内の検索です。DB更新：${date.toLocaleDateString('ja-JP')}`;
        }
      }catch(error){
        console.error(error);
        if(badge){badge.textContent='読込エラー';badge.className='badge warn'}
        const box=document.querySelector('#lovecaCardResults');
        if(box)box.innerHTML=`<p class="note">カードデータを読み込めませんでした。通信状態を確認して再読み込みしてください。</p>`;
      }finally{loading=null}
    })();
    return loading;
  }

  function populateFilters(){
    fillSelect('#lovecaColorFilter',unique(cards.map(c=>c.color)));
    fillSelect('#lovecaRarityFilter',unique(cards.map(c=>c.rarity)));
    fillSelect('#lovecaExpansionFilter',unique(cards.map(c=>c.expansion)));
  }
  function unique(values){
    return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));
  }
  function fillSelect(selector,values){
    const select=document.querySelector(selector);if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="">すべて</option>';
    for(const value of values){
      const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);
    }
    if(values.includes(current))select.value=current;
  }

  function bindBrowserControls(){
    ['#lovecaQuery','#lovecaTypeFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaSort','#lovecaFavoritesOnly']
      .forEach(selector=>document.querySelector(selector)?.addEventListener(selector==='#lovecaQuery'?'input':'change',()=>{visibleCount=PAGE_SIZE;applyFilters()}));
    document.querySelector('#lovecaClearFilters')?.addEventListener('click',()=>{
      document.querySelector('#lovecaQuery').value='';
      document.querySelector('#lovecaTypeFilter').value='all';
      document.querySelector('#lovecaColorFilter').value='';
      document.querySelector('#lovecaRarityFilter').value='';
      document.querySelector('#lovecaExpansionFilter').value='';
      document.querySelector('#lovecaSort').value='no-asc';
      document.querySelector('#lovecaFavoritesOnly').checked=false;
      visibleCount=PAGE_SIZE;applyFilters();
    });
    document.querySelector('#lovecaLoadMore')?.addEventListener('click',()=>{visibleCount+=PAGE_SIZE;renderCards()});
    document.querySelector('#lovecaQuery')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}});
  }

  function applyFilters(){
    if(!loaded)return;
    const query=(document.querySelector('#lovecaQuery')?.value||'').trim().toLocaleLowerCase('ja');
    const type=document.querySelector('#lovecaTypeFilter')?.value||'all';
    const color=document.querySelector('#lovecaColorFilter')?.value||'';
    const rarity=document.querySelector('#lovecaRarityFilter')?.value||'';
    const expansion=document.querySelector('#lovecaExpansionFilter')?.value||'';
    const favOnly=!!document.querySelector('#lovecaFavoritesOnly')?.checked;
    const favs=favorites();

    filtered=cards.filter(card=>{
      const cardType=String(card.cardType||'');
      if(type==='live'&&!card.isLive)return false;
      if(type==='member'&&cardType!=='メンバー')return false;
      if(type==='energy'&&cardType!=='エネルギー')return false;
      if(color&&String(card.color||'')!==color)return false;
      if(rarity&&String(card.rarity||'')!==rarity)return false;
      if(expansion&&String(card.expansion||'')!==expansion)return false;
      if(favOnly&&!favs.has(String(card.id)))return false;
      if(query){
        const hay=[card.name,card.cardNo,card.text,card.expansion,card.work,card.unit,card.rarity].join(' ').toLocaleLowerCase('ja');
        if(!hay.includes(query))return false;
      }
      return true;
    });

    const sort=document.querySelector('#lovecaSort')?.value||'no-asc';
    filtered.sort((a,b)=>{
      if(sort==='name')return String(a.name||'').localeCompare(String(b.name||''),'ja',{numeric:true});
      const result=String(a.cardNo||'').localeCompare(String(b.cardNo||''),'ja',{numeric:true});
      return sort==='no-desc'?-result:result;
    });
    renderCards();
  }

  function renderCards(){
    const count=document.querySelector('#lovecaResultCount');
    if(count)count.textContent=`${filtered.length.toLocaleString()}件`;
    const box=document.querySelector('#lovecaCardResults');
    if(!box)return;
    const shown=filtered.slice(0,visibleCount);
    if(!shown.length){box.innerHTML='<p class="note">条件に一致するカードがありません。</p>';}
    else box.innerHTML=shown.map(cardMarkup).join('');

    box.querySelectorAll('[data-favorite-card]').forEach(button=>button.addEventListener('click',()=>toggleFavorite(button.dataset.favoriteCard)));
    const more=document.querySelector('#lovecaLoadMore');
    if(more){
      more.classList.toggle('hidden',visibleCount>=filtered.length);
      more.textContent=`さらに表示（${Math.min(PAGE_SIZE,Math.max(0,filtered.length-visibleCount))}件）`;
    }
  }

  function cardMarkup(card){
    const fav=isFavorite(card);
    const hearts=heartOrder.map(([key,label])=>{
      const value=Number(card.hearts?.[key])||0;
      return value?`<span class="loveca-heart loveca-heart-${key}">${label}♥${value}</span>`:'';
    }).join('');
    const meta=[card.cardNo,card.rarity,card.cardType,card.color].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('');
    return `<article class="loveca-card-item">
      <div class="loveca-card-image-wrap">
        ${card.imageUrl?`<img class="loveca-card-image" src="${esc(card.imageUrl)}" alt="${esc(card.name)}" loading="lazy" decoding="async">`:''}
      </div>
      <div class="loveca-card-body">
        <div class="loveca-card-meta">${meta}</div>
        <h3>${esc(card.name||'名称未設定')}</h3>
        ${card.work?`<div class="loveca-card-sub">${esc(card.work)}${card.unit?` ／ ${esc(card.unit)}`:''}</div>`:''}
        ${hearts?`<div class="loveca-hearts">${hearts}</div>`:''}
        <p class="loveca-effect">${esc(card.text||'')}</p>
        <div class="loveca-card-actions">
          ${card.isLive?`<button type="button" class="${fav?'primary-btn':'ghost-btn'} loveca-favorite-btn" data-favorite-card="${esc(card.id)}">${fav?'★ お気に入り':'☆ お気に入り'}</button>`:''}
          ${card.detailUrl?`<a class="ghost-btn loveca-official-link" href="${esc(card.detailUrl)}" target="_blank" rel="noopener">公式詳細</a>`:''}
        </div>
      </div>
    </article>`;
  }

  function toggleFavorite(id){
    const card=cardById(id);if(!card||!card.isLive)return;
    const set=favorites();
    if(set.has(String(id)))set.delete(String(id));else set.add(String(id));
    saveFavorites(set);
    syncFavoriteOptions();
    applyFilters();
  }

  function favoriteLiveCards(){
    const set=favorites();
    return cards.filter(card=>card.isLive&&set.has(String(card.id)))
      .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ja',{numeric:true}));
  }

  function syncFavoriteOptions(){
    if(!loaded||favoriteSyncing)return;
    favoriteSyncing=true;
    try{
      const favCards=favoriteLiveCards();
      for(let i=0;i<3;i++){
        const select=document.querySelector(`#livePreset${i+1}Select`);if(!select)continue;
        const current=select.value;
        select.querySelectorAll('optgroup[data-loveca-favorites]').forEach(node=>node.remove());
        if(favCards.length){
          const group=document.createElement('optgroup');
          group.label='★ お気に入りライブ';
          group.dataset.lovecaFavorites='1';
          for(const card of favCards){
            const option=document.createElement('option');
            option.value=`__loveca_fav__${card.id}`;
            option.textContent=`★ ${card.name}${card.cardNo?`（${card.cardNo}）`:''}`;
            group.append(option);
          }
          select.append(group);
        }
        if([...select.options].some(option=>option.value===current))select.value=current;
      }
    }finally{favoriteSyncing=false}
  }

  function setupLiveSelectIntegration(){
    for(let i=0;i<3;i++){
      const select=document.querySelector(`#livePreset${i+1}Select`);if(!select)continue;
      select.addEventListener('change',event=>{
        const value=event.target.value||'';
        if(!value.startsWith('__loveca_fav__'))return;
        const id=value.slice('__loveca_fav__'.length);
        const card=cardById(id);
        if(card)applyFavoriteToLive(i,card);
      });
      const observer=new MutationObserver(()=>{
        if(favoriteSyncing||!loaded)return;
        const needsFavorites=favoriteLiveCards().length>0;
        const hasGroup=!!select.querySelector('optgroup[data-loveca-favorites]');
        if(needsFavorites&&!hasGroup)queueMicrotask(syncFavoriteOptions);
      });
      observer.observe(select,{childList:true});
    }
  }

  function applyFavoriteToLive(liveIndex,card){
    const keys=['pink','red','yellow','green','blue','purple','colorless'];
    keys.forEach((key,row)=>{
      const input=document.querySelector(`.number-cell[data-row="${row}"][data-column="${liveIndex+1}"]`);
      if(!input)return;
      input.value=String(Number(card.hearts?.[key])||0);
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
  }

  function init(){
    ensureCss();
    setupLoveTabs();
    setupLiveSelectIntegration();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
