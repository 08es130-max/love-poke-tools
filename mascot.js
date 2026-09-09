(()=>{
  const SETTINGS_KEY='lovepoke_mascot_settings_v1';
  const DB_NAME='lovepoke_mascot_db';
  const DB_STORE='images';
  const IMAGE_KEY='active';
  const defaults={enabled:true,moving:true,speech:true,size:'medium',speed:'normal'};
  let settings=loadSettings();
  let mascot=null,bubble=null,settingsBtn=null,dialog=null;
  let imageUrl='';
  let dir='right';
  let x=16,y=16;
  let lastTs=0;
  let pauseUntil=0;
  let nextPauseAt=performance.now()+12000+Math.random()*10000;

  const speedMap={slow:24,normal:42,fast:68};
  const sizeMap={small:56,medium:76,large:104};
  const phrases=['ふふ、順調ですね。','少しだけ見守っています。','次は何をしましょうか？','焦らず進めていきましょう。','ここにいますよ。'];

  function loadSettings(){
    try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return {...defaults}}
  }
  function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}
  function ensureCss(){
    if(document.querySelector('link[data-mascot-css]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='./mascot.css';link.dataset.mascotCss='1';document.head.append(link);
  }
  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE)};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function storeImage(blob){
    const db=await openDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(blob,IMAGE_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
  }
  async function loadImage(){
    try{
      const db=await openDb();
      const blob=await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).get(IMAGE_KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)});
      db.close();return blob;
    }catch{return null}
  }
  async function clearStoredImage(){
    try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(IMAGE_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}catch{}
  }
  function setMascotImage(blob){
    if(imageUrl)URL.revokeObjectURL(imageUrl);
    imageUrl=blob?URL.createObjectURL(blob):'';
    if(mascot){mascot.src=imageUrl;mascot.classList.toggle('mascot-no-image',!imageUrl)}
    refreshVisibility();
  }
  function viewport(){
    const s=sizeMap[settings.size]||sizeMap.medium;
    const pad=8;
    return {s,pad,maxX:Math.max(pad,innerWidth-s-pad),maxY:Math.max(pad,innerHeight-s-pad)};
  }
  function clampPosition(){const v=viewport();x=Math.min(v.maxX,Math.max(v.pad,x));y=Math.min(v.maxY,Math.max(v.pad,y))}
  function applySize(){if(!mascot)return;const s=sizeMap[settings.size]||sizeMap.medium;mascot.style.width=`${s}px`;mascot.style.height=`${s}px`;clampPosition();paint()}
  function paint(){if(!mascot)return;mascot.style.transform=`translate3d(${x}px,${y}px,0) scaleX(${dir==='left'?-1:1})`}
  function refreshVisibility(){
    if(!mascot)return;
    const visible=settings.enabled&&!!imageUrl;
    mascot.classList.toggle('hidden',!visible);
    if(settingsBtn)settingsBtn.classList.toggle('mascot-configured',!!imageUrl);
  }
  function maybePause(ts){
    if(!settings.moving||ts<pauseUntil)return;
    if(ts>=nextPauseAt){
      pauseUntil=ts+1100+Math.random()*1900;
      nextPauseAt=pauseUntil+9000+Math.random()*13000;
      mascot?.classList.add('mascot-paused');
      if(settings.speech&&Math.random()<0.45)showBubble(phrases[Math.floor(Math.random()*phrases.length)],1900);
      setTimeout(()=>mascot?.classList.remove('mascot-paused'),Math.max(0,pauseUntil-performance.now()));
    }
  }
  function step(ts){
    if(!lastTs)lastTs=ts;
    const dt=Math.min(0.05,(ts-lastTs)/1000);lastTs=ts;
    maybePause(ts);
    if(mascot&&settings.enabled&&settings.moving&&imageUrl&&ts>=pauseUntil){
      const v=viewport();const d=(speedMap[settings.speed]||speedMap.normal)*dt;
      if(dir==='right'){x+=d;if(x>=v.maxX){x=v.maxX;dir='down'}}
      else if(dir==='down'){y+=d;if(y>=v.maxY){y=v.maxY;dir='left'}}
      else if(dir==='left'){x-=d;if(x<=v.pad){x=v.pad;dir='up'}}
      else {y-=d;if(y<=v.pad){y=v.pad;dir='right'}}
      paint();
    }
    requestAnimationFrame(step);
  }
  function showBubble(text,ms=2200){
    if(!bubble||!settings.speech||!imageUrl)return;
    bubble.textContent=text;bubble.classList.remove('hidden');
    const v=viewport();
    const left=Math.min(innerWidth-190,Math.max(8,x+v.s/2-85));
    const top=Math.max(8,y-54);
    bubble.style.left=`${left}px`;bubble.style.top=`${top}px`;
    clearTimeout(showBubble.timer);showBubble.timer=setTimeout(()=>bubble.classList.add('hidden'),ms);
  }
  function openSettings(){
    syncDialog();
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  function syncDialog(){
    if(!dialog)return;
    dialog.querySelector('#mascotEnabled').checked=settings.enabled;
    dialog.querySelector('#mascotMoving').checked=settings.moving;
    dialog.querySelector('#mascotSpeech').checked=settings.speech;
    dialog.querySelector('#mascotSize').value=settings.size;
    dialog.querySelector('#mascotSpeed').value=settings.speed;
    dialog.querySelector('#mascotImageStatus').textContent=imageUrl?'画像設定済み':'画像未設定';
  }
  function bindDialog(){
    const q=s=>dialog.querySelector(s);
    q('#mascotEnabled').onchange=e=>{settings.enabled=e.target.checked;saveSettings();refreshVisibility()};
    q('#mascotMoving').onchange=e=>{settings.moving=e.target.checked;saveSettings()};
    q('#mascotSpeech').onchange=e=>{settings.speech=e.target.checked;saveSettings();if(!settings.speech)bubble.classList.add('hidden')};
    q('#mascotSize').onchange=e=>{settings.size=e.target.value;saveSettings();applySize()};
    q('#mascotSpeed').onchange=e=>{settings.speed=e.target.value;saveSettings()};
    q('#mascotImageInput').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      if(!file.type.startsWith('image/')){alert('画像ファイルを選んでください。');return}
      if(file.size>8*1024*1024){alert('画像は8MB以下を推奨します。');return}
      try{await storeImage(file);setMascotImage(file);settings.enabled=true;saveSettings();syncDialog()}catch{alert('画像を保存できませんでした。')}
      e.target.value='';
    };
    q('#mascotClearImage').onclick=async()=>{await clearStoredImage();setMascotImage(null);syncDialog()};
    q('#mascotTestSpeech').onclick=()=>showBubble(phrases[Math.floor(Math.random()*phrases.length)],2400);
  }
  async function init(){
    ensureCss();
    mascot=document.createElement('img');
    mascot.id='edgeMascot';mascot.alt='マスコット';mascot.draggable=false;mascot.className='edge-mascot hidden';
    mascot.addEventListener('click',()=>{mascot.classList.remove('mascot-hop');void mascot.offsetWidth;mascot.classList.add('mascot-hop');setTimeout(()=>mascot.classList.remove('mascot-hop'),600);showBubble(phrases[Math.floor(Math.random()*phrases.length)])});

    bubble=document.createElement('div');bubble.className='mascot-bubble hidden';
    settingsBtn=document.createElement('button');settingsBtn.id='mascotSettingsBtn';settingsBtn.type='button';settingsBtn.className='mascot-settings-btn';settingsBtn.textContent='✦';settingsBtn.setAttribute('aria-label','マスコット設定');settingsBtn.onclick=openSettings;

    dialog=document.createElement('dialog');dialog.id='mascotDialog';dialog.className='mascot-dialog';dialog.innerHTML=`<form method="dialog" class="mascot-dialog-card">
      <div class="mascot-dialog-head"><div><h2>マスコット設定</h2><p>好きな画像をこの端末だけに保存して、画面の端を歩かせます。</p></div><button value="cancel" class="ghost-btn">閉じる</button></div>
      <div class="mascot-setting-grid">
        <label class="mascot-switch"><span>表示する</span><input id="mascotEnabled" type="checkbox"></label>
        <label class="mascot-switch"><span>動かす</span><input id="mascotMoving" type="checkbox"></label>
        <label class="mascot-switch"><span>タップ時にセリフ</span><input id="mascotSpeech" type="checkbox"></label>
        <label>大きさ<select id="mascotSize"><option value="small">小</option><option value="medium">中</option><option value="large">大</option></select></label>
        <label>速度<select id="mascotSpeed"><option value="slow">ゆっくり</option><option value="normal">普通</option><option value="fast">速い</option></select></label>
      </div>
      <div class="mascot-image-box">
        <div><strong id="mascotImageStatus">画像未設定</strong><div class="mascot-note">透過PNGがおすすめです。画像はGitHubやFirebaseへ送らず、この端末内だけに保存します。</div></div>
        <label class="primary-btn mascot-upload-btn">画像を選ぶ<input id="mascotImageInput" type="file" accept="image/*"></label>
      </div>
      <div class="mascot-dialog-actions"><button id="mascotTestSpeech" type="button" class="ghost-btn">タップ反応を試す</button><button id="mascotClearImage" type="button" class="danger-btn">画像を削除</button></div>
    </form>`;
    document.body.append(mascot,bubble,settingsBtn,dialog);bindDialog();
    const blob=await loadImage();if(blob)setMascotImage(blob);else refreshVisibility();
    const v=viewport();x=v.pad;y=v.maxY;dir='right';applySize();syncDialog();
    addEventListener('resize',()=>{clampPosition();paint()});
    requestAnimationFrame(step);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
