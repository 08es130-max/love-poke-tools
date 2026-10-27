/* Loveca local wishlist — isolated from cloud synced battle data. */
(()=>{
'use strict';
const KEY='lovepoke_loveca_wishlist_v1';
let cards=[], ready=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(e){alert('端末への保存に失敗しました。空き容量を確認してください。');return false}};
const card=id=>cards.find(c=>String(c.id)===String(id));
const button=(label,id,action)=>'<button type="button" class="ghost-btn" data-wish-action="'+action+'" data-wish-id="'+esc(id)+'">'+label+'</button>';
function setup(){
 const nav=document.querySelector('#loveScreen > .love-subnav');
 const browser=document.querySelector('#loveCardBrowserPane');
 if(!nav||!browser||document.querySelector('#loveWishlistPane'))return false;
 const tab=document.createElement('button');tab.type='button';tab.className='love-tab';tab.dataset.lovePane='wishlist';tab.textContent='欲しいもの';
 nav.append(tab);
 const pane=document.createElement('div');pane.id='loveWishlistPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>欲しいものリスト</h2><span class="badge ok">この端末に保存</span></div><p class="hint">カード検索から登録できます。日付・店名・価格は購入候補のメモとして保存します。</p><div id="loveWishlistItems"></div></section>';
 browser.after(pane);
 tab.addEventListener('click',()=>{nav.querySelectorAll('.love-tab').forEach(x=>x.classList.toggle('active',x===tab));document.querySelector('#loveCalcPane')?.classList.add('hidden');browser.classList.add('hidden');pane.classList.remove('hidden');document.querySelector('#appTitle').textContent='ラブカ 欲しいものリスト';document.querySelector('#resetAllBtn').style.display='none';render()});
 nav.querySelectorAll('.love-tab:not([data-love-pane="wishlist"])').forEach(x=>x.addEventListener('click',()=>pane.classList.add('hidden')));
 document.querySelector('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){document.querySelector('#appTitle').textContent='ラブカ 欲しいものリスト';document.querySelector('#resetAllBtn').style.display='none'}});
 document.addEventListener('click',e=>{
 const b=e.target.closest('[data-wish-action]');if(!b)return;
 const id=b.dataset.wishId, action=b.dataset.wishAction, list=read();
 if(action==='add'){if(!card(id))return;list[id]??={date:'',shop:'',price:'',quantity:1};if(write(list)){render();refreshButtons()}}
 if(action==='remove'){if(!confirm('欲しいものリストから削除しますか？'))return;delete list[id];if(write(list)){render();refreshButtons()}}
 });
 pane.addEventListener('change',e=>{
 const el=e.target.closest('[data-wish-field]');if(!el)return;
 const list=read(),entry=list[el.dataset.wishId];if(!entry)return;
 const field=el.dataset.wishField;
 if(!['date','shop','price','quantity'].includes(field))return;
 entry[field]=field==='price'||field==='quantity'?Math.max(0,Number(el.value)||0):el.value.slice(0,150);
 write(list);
 });
 const observer=new MutationObserver(()=>refreshButtons());
 const results=document.querySelector('#lovecaCardResults');if(results)observer.observe(results,{childList:true});
 refreshButtons();render();return true;
}
function refreshButtons(){
 const results=document.querySelector('#lovecaCardResults');if(!results)return;
 const saved=read();
 results.querySelectorAll('.loveca-card-item').forEach(article=>{
  const actions=article.querySelector('.loveca-card-actions');if(!actions||actions.querySelector('[data-wish-action]'))return;
  const no=article.querySelector('.loveca-card-meta span')?.textContent?.trim();
  const c=cards.find(x=>x.cardNo===no);
  if(!c)return;
  const b=document.createElement('button');b.type='button';b.className='ghost-btn';b.dataset.wishAction='add';b.dataset.wishId=String(c.id);
  b.textContent=saved[c.id]?'✓ 欲しいもの登録済':'＋ 欲しいもの';actions.prepend(b);
 });
 results.querySelectorAll('[data-wish-action="add"]').forEach(b=>b.textContent=saved[b.dataset.wishId]?'✓ 欲しいもの登録済':'＋ 欲しいもの');
}
function render(){
 const target=document.querySelector('#loveWishlistItems');if(!target)return;
 const saved=read(),entries=Object.entries(saved);
 if(!entries.length){target.innerHTML='<p class="note">まだ登録されていません。カード検索から追加してください。</p>';return}
 target.innerHTML=entries.map(([id,v])=>{
 const c=card(id);
 if(!c)return '<div class="panel">カードID '+esc(id)+'（カードデータ未取得） '+button('削除',id,'remove')+'</div>';
 const field=(key,type,label)=>'<label style="display:block;min-width:0">'+label+'<input style="width:100%" type="'+type+'" data-wish-id="'+esc(id)+'" data-wish-field="'+key+'" value="'+esc(v[key]??'')+'" '+(type==='number'?'min="0"':'')+'></label>';
 return '<article class="loveca-card-item" style="margin:10px 0"><div class="loveca-card-image-wrap">'+(c.imageUrl?'<img class="loveca-card-image" loading="lazy" src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':'')+'</div><div class="loveca-card-body"><div class="loveca-card-meta">'+esc(c.cardNo)+'</div><h3>'+esc(c.name)+'</h3><p class="loveca-effect">'+esc(c.text)+'</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">'+field('date','date','日付')+field('shop','text','店名')+field('price','number','価格（円）')+field('quantity','number','希望枚数')+'</div><div class="loveca-card-actions" style="margin-top:8px">'+button('リストから削除',id,'remove')+'</div></div></article>';
 }).join('');
}
async function init(){
 if(ready)return;ready=true;
 try{const r=await fetch('./loveca-cards.json');if(!r.ok)throw Error('cards');const data=await r.json();cards=Array.isArray(data.cards)?data.cards:[]}catch(e){console.warn('wishlist cards unavailable',e)}
 if(!setup()){ready=false;setTimeout(init,500)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();