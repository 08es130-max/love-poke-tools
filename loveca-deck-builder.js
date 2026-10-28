(()=>{
'use strict';
const KEY='lovepoke_loveca_card_decks_v1';
let cards=[],selected='';
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const put=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch{alert('保存に失敗しました');return false}};
const lookup=id=>cards.find(c=>String(c.id)===String(id));
function render(){
 const chooser=$('#lovecaDeckChooser'),stats=$('#lovecaDeckStats'),items=$('#lovecaDeckItems');
 if(!chooser)return;
 const decks=get();if(!decks.some(d=>d.id===selected))selected=decks[0]?.id||'';
 chooser.innerHTML=decks.length?decks.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.name)+'</option>').join(''):'<option value="">未作成</option>';chooser.value=selected;
 const deck=decks.find(d=>d.id===selected);
 if(!deck){stats.textContent='「新規作成」からデッキを登録してください。';items.innerHTML='';return}
 const entries=Object.entries(deck.cards||{}).filter(([,n])=>n>0);
 let nonBlade=0;const costs={},colors={};let unknown=0;
 for(const [id,count] of entries){
  const c=lookup(id);if(!c){unknown+=count;continue}
  if(c.cardType==='メンバー'&&c.cost!==null&&c.cost!==undefined&&c.cost!==''){const k=String(c.cost);costs[k]=(costs[k]||0)+count}
  const kinds=new Set([...(Array.isArray(c.bladeHeartTypes)?c.bladeHeartTypes:[]),...(c.specialHeart?[c.specialHeart]:[])]);
  if(!c.hasBladeHeart&&!kinds.size)nonBlade+=count;
  for(const kind of kinds)colors[kind]=(colors[kind]||0)+count;
 }
 const total=entries.reduce((n,[,c])=>n+c,0);
 const max=Math.max(1,...Object.values(costs));
 stats.innerHTML='<h3>デッキ分析：'+total+'枚</h3><p>非ブレ（ライブ含む）：<strong>'+nonBlade+'枚</strong></p><h3>メンバーのコスト分布</h3>'+Object.entries(costs).sort((a,b)=>Number(a[0])-Number(b[0])).map(([cost,n])=>'<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><span>'+escape(cost)+'</span><div style="flex:1;background:#aaa3;border-radius:5px"><div style="width:'+(100*n/max)+'%;height:15px;background:#ee7eaa;border-radius:5px"></div></div><strong>'+n+'</strong></div>').join('')+'<h3>ブレードハートの色別カード枚数</h3><p>'+Object.entries(colors).map(([color,n])=>escape(color)+'：'+n+'枚').join(' ／ ')+'</p><p class="hint">色別集計は該当色を持つカード枚数です。ブレードハートのシンボル個数とは異なります。通常ハートは加算していません。</p>'+(unknown?'<p class="hint">カード情報未取得：'+unknown+'枚</p>':'');
 items.innerHTML=entries.map(([id,n])=>{const c=lookup(id);return '<div style="display:flex;gap:8px;align-items:center;border-bottom:1px solid #aaa4;padding:8px 0">'+(c?.imageUrl?'<img src="'+escape(c.imageUrl)+'" loading="lazy" style="width:45px">':'')+'<div style="flex:1;min-width:0"><strong>'+escape(c?.name||id)+'</strong><div class="hint">'+escape(c?.cardNo||'')+'</div></div><button class="ghost-btn" data-deck-adjust="'+escape(id)+'" data-delta="-1">−</button><strong>'+n+'</strong><button class="ghost-btn" data-deck-adjust="'+escape(id)+'" data-delta="1">＋</button></div>'}).join('')||'<p class="note">カード検索から追加してください。</p>';
}
function addButtons(){
 const box=$('#lovecaCardResults');if(!box||!cards.length)return;
 const byNumber=new Map(cards.map(c=>[String(c.cardNo),c]));
 box.querySelectorAll('.loveca-card-item').forEach(el=>{
  const actions=el.querySelector('.loveca-card-actions');if(!actions||actions.querySelector('[data-deck-add]'))return;
  const c=byNumber.get(el.querySelector('.loveca-card-meta span')?.textContent?.trim());if(!c||c.cardType==='エネルギー')return;
  const button=document.createElement('button');button.type='button';button.className='ghost-btn';button.dataset.deckAdd=c.id;button.textContent='＋ デッキに追加';actions.append(button);
 });
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.type='button';tab.dataset.lovePane='builder';tab.textContent='デッキ構築';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveDeckBuilderPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>デッキ構築</h2><span class="badge ok">端末に保存</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="lovecaDeckChooser" style="flex:1;min-width:120px"></select><button type="button" class="primary-btn" id="lovecaDeckNew">新規作成</button><button type="button" class="ghost-btn" id="lovecaDeckDelete">削除</button></div><div id="lovecaDeckStats"></div><div id="lovecaDeckItems"></div></section>';
 browser.after(pane);
 const addDialog=document.createElement('dialog');
 addDialog.id='lovecaDeckAddDialog';
 addDialog.style.cssText='width:min(92vw,420px);max-height:80dvh;overflow:auto;border:1px solid #e7b1c9;border-radius:14px;padding:18px;background:#fff;color:#333;box-shadow:0 12px 40px #0005';
 addDialog.innerHTML='<form method="dialog"><h3 style="margin:0 0 8px">デッキに追加</h3><p id="lovecaDeckAddCardName" style="margin:0 0 12px;overflow-wrap:anywhere"></p><label style="display:block;margin-bottom:12px">追加するデッキ<select id="lovecaDeckAddChoice" style="display:block;width:100%;min-height:44px;margin-top:6px"></select></label><p id="lovecaDeckAddEmpty" class="hint" style="display:none">デッキがありません。先にデッキ構築から作成してください。</p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="lovecaDeckAddCancel" class="ghost-btn">キャンセル</button><button type="button" id="lovecaDeckAddConfirm" class="primary-btn">OK・追加</button></div></form>';
 document.body.append(addDialog);
 const toast=document.createElement('div');toast.id='lovecaDeckAddToast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.style.cssText='position:fixed;left:50%;bottom:105px;transform:translateX(-50%);z-index:99999;background:#a82e65;color:white;border-radius:12px;padding:12px 18px;font-weight:bold;box-shadow:0 5px 20px #0003;max-width:90vw;text-align:center;display:none';document.body.append(toast);
 let pendingAdd='',toastTimer;
 const notify=message=>{toast.textContent=message;toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.display='none',2400)};
 $('#lovecaDeckAddCancel').onclick=()=>addDialog.close();
 $('#lovecaDeckAddConfirm').onclick=()=>{
  const deckId=$('#lovecaDeckAddChoice').value,all=get(),deck=all.find(d=>d.id===deckId);
  if(!deck||!pendingAdd)return;
  deck.cards=deck.cards||{};
  deck.cards[pendingAdd]=(Number(deck.cards[pendingAdd])||0)+1;
  if(!put(all))return;
  selected=deckId;
  const name=lookup(pendingAdd)?.name||'カード';
  addDialog.close();pendingAdd='';render();notify('「'+name+'」を「'+deck.name+'」に追加しました');
 };

 tab.onclick=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));$('#loveCalcPane')?.classList.add('hidden');browser.classList.add('hidden');$('#loveWishlistPane')?.classList.add('hidden');pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ デッキ構築';$('#resetAllBtn').style.display='none';render()};
 nav.querySelectorAll('.love-tab:not([data-love-pane="builder"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){$('#appTitle').textContent='ラブカ デッキ構築';$('#resetAllBtn').style.display='none'}});
 $('#lovecaDeckChooser').onchange=e=>{selected=e.target.value;render()};
 $('#lovecaDeckNew').onclick=()=>{const name=prompt('デッキ名','新しいデッキ');if(!name?.trim())return;const all=get(),id='d'+Date.now();all.push({id,name:name.trim(),cards:{}});if(put(all)){selected=id;render()}};
 $('#lovecaDeckDelete').onclick=()=>{if(!selected||!confirm('デッキを削除しますか？'))return;const all=get().filter(d=>d.id!==selected);if(put(all)){selected='';render()}};
 document.addEventListener('click',e=>{
  const add=e.target.closest('[data-deck-add]'),adjust=e.target.closest('[data-deck-adjust]');
  if(!add&&!adjust)return;
  if(add){
   const all=get();pendingAdd=String(add.dataset.deckAdd);
   const choice=$('#lovecaDeckAddChoice');
   choice.innerHTML=all.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.name)+'</option>').join('');
   choice.value=all.some(d=>d.id===selected)?selected:(all[0]?.id||'');
   $('#lovecaDeckAddCardName').textContent=lookup(pendingAdd)?.name||'選択したカード';
   $('#lovecaDeckAddEmpty').style.display=all.length?'none':'block';
   $('#lovecaDeckAddConfirm').disabled=!all.length;
   addDialog.showModal();return;
  }
  const id=adjust.dataset.deckAdjust,delta=Number(adjust.dataset.delta),all=get(),deck=all.find(d=>d.id===selected);
  if(!deck)return;
  deck.cards[id]=Math.max(0,(deck.cards[id]||0)+delta);if(!deck.cards[id])delete deck.cards[id];
  if(put(all))render();
 });
 const box=$('#lovecaCardResults');if(box)new MutationObserver(addButtons).observe(box,{childList:true});
 fetch('./loveca-cards.json').then(r=>r.json()).then(data=>{cards=Array.isArray(data.cards)?data.cards:[];addButtons();render()}).catch(console.warn);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();