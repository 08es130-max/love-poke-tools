function setupManualPokemonToggle(){
  const panel=document.querySelector('.manual-pokemon-panel');
  if(!panel||panel.dataset.collapsibleReady==='1')return;

  panel.dataset.collapsibleReady='1';

  const button=document.createElement('button');
  button.type='button';
  button.className='wide-btn';
  button.id='toggleManualPokemonBtn';
  button.textContent='使用ポケモン（手動編集）を開く';
  button.setAttribute('aria-expanded','false');

  const content=document.createElement('div');
  content.id='manualPokemonContent';
  content.className='hidden';

  const originalChildren=Array.from(panel.childNodes);
  for(const node of originalChildren)content.appendChild(node);

  panel.append(button,content);

  button.addEventListener('click',()=>{
    const opening=content.classList.contains('hidden');
    content.classList.toggle('hidden',!opening);
    button.textContent=opening
      ?'使用ポケモン（手動編集）を閉じる'
      :'使用ポケモン（手動編集）を開く';
    button.setAttribute('aria-expanded',String(opening));
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',setupManualPokemonToggle,{once:true});
}else{
  setupManualPokemonToggle();
}
