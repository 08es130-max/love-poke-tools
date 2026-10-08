(() => {
'use strict';
const ROOT='lovePokeMascotRoot',KEY='lovepoke_mascot_settings_v3',OLD='lovepoke_mascot_settings_v2',VER='0.9.68';
const C={
 ayumu:['上原歩夢','ayumu'],kasumi:['中須かすみ','kasumi'],shizuku:['桜坂しずく','shizuku'],karin:['朝香果林','karin'],
 ai:['宮下愛','ai'],kanata:['近江彼方','kanata'],setsuna:['優木せつ菜','setsuna'],emma:['エマ・ヴェルデ','emma'],
 rina:['天王寺璃奈','rina'],shioriko:['三船栞子','shioriko'],mia:['ミア・テイラー','mia'],lanzhu:['鐘嵐珠','lanzhu'],yu:['高咲侑','yu']
};
const P={
 ayumu:['今日も一緒にがんばろうね！','ちゃんと見てるからね','えへへ、呼んだ？','無理しすぎちゃだめだよ'],
 kasumi:['かすみんを呼びましたね？','今日もかすみんが一番かわいいです！','もっとかまってください！','かわいいって言ってもいいんですよ？'],
 shizuku:['今日も素敵な一日にしましょう','ふふっ、見つけてくれたんですね','その挑戦、応援しています','一緒ならきっと大丈夫です'],
 karin:['ふふ、私を呼んだの？','焦らなくても大丈夫よ','たまには肩の力を抜きなさい','私がそばにいるから安心して'],
 ai:['やっほー！愛さんだよ！','今日も元気にいこー！','困ったら愛さんにおまかせ！','いい感じじゃん、その調子！'],
 kanata:['彼方ちゃん、ここにいるよ〜','ちょっとだけ休憩しよ〜？','ゆっくりでも進めば大丈夫だよ〜','今日もえらい、えらい〜'],
 setsuna:['今日も全力でいきましょう！','大好きを貫きましょう！','一緒に思いっきり楽しみましょう！','全力で応援します！'],
 emma:['今日もにこにこでいこうね','疲れたら少し休もう？','がんばってるの、ちゃんと見てるよ','無理しないで、ゆっくりでいいよ'],
 rina:['見つけてくれて、うれしい','今日も一緒にがんばろう','ちょっとだけ、そばにいてもいい？','うれしい。顔に出てると思う'],
 shioriko:['今日もよろしくお願いします','何かお手伝いしましょうか？','焦らず、一つずつ進めましょう','あなたなら大丈夫だと思います'],
 mia:['Hey、呼んだ？','それくらいならボクに任せてよ','まあ、悪くないんじゃない？','終わったら少しくらい褒めてあげる'],
 lanzhu:['ランジュに会いたかったの？','当然、今日も最高に決まってるわ！','もっと自信を持ちなさい！','ランジュが応援してあげる！'],
 yu:['今日もみんなを応援しよう！','ときめくこと、見つかった？','その好きって気持ち、大事にしようね','今日もいっぱいときめこう！']
};
const speed={slow:24,normal:42,fast:68},size={small:68,medium:88,large:112};
let S=load(),root,layer,dialog,status,lineupButton,actors=[],last=0,metrics=new Map();
function valid(a){return [...new Set((Array.isArray(a)?a:[]).filter(x=>C[x]))]}
function load(){try{let s=JSON.parse(localStorage.getItem(KEY)||'{}'),sel=valid(s.selectedCharacters);if(!sel.length){let o=JSON.parse(localStorage.getItem(OLD)||'{}');sel=o.character&&C[o.character]?[o.character]:['shioriko']}return{enabled:true,moving:true,speech:true,lineup:false,size:'medium',speed:'normal',...s,selectedCharacters:sel}}catch{return{enabled:true,moving:true,speech:true,lineup:false,size:'medium',speed:'normal',selectedCharacters:['shioriko']}}}
function save(){S.selectedCharacters=valid(S.selectedCharacters);if(!S.selectedCharacters.length)S.selectedCharacters=['shioriko'];localStorage.setItem(KEY,JSON.stringify(S));localStorage.setItem(OLD,JSON.stringify({enabled:S.enabled,character:S.selectedCharacters[0],moving:S.moving,speech:S.speech,size:S.size,speed:S.speed}))}
function sprite(id){return './assets/mascot/'+C[id][1]+'-sprite.png?v='+VER}
// Visible character height is normalized, not the transparent sprite cell height.
function crowdScale(n){if(n>=13)return .77;if(n>=9)return .82;if(n>=5)return .88;if(n>=2)return .94;return 1}
function dims(id){
  const m=metrics.get(id)||{fw:272,fh:217,visibleRatio:.76};
  const count=Math.max(1,valid(S.selectedCharacters).length);
  const intendedVisibleHeight=(size[S.size]||88)*.85*crowdScale(count);
  const ratio=Math.min(.95,Math.max(.48,m.visibleRatio||.76));
  const h=intendedVisibleHeight/ratio;
  return{w:h*m.fw/m.fh,h,fw:m.fw,fh:m.fh}
}
// Measure the actual nontransparent artwork; several PNGs have different padding.
function spriteVisibleRatio(image,fw,fh){
  try{
    const w=Math.round(fw),h=Math.round(fh);
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return .76;
    const ratios=[];
    for(const r of [0,2,3,4]){
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(image,0,r*fh,fw,fh,0,0,w,h);
      const data=ctx.getImageData(0,0,w,h).data;
      let top=h,bottom=-1;
      for(let y=0;y<h;y+=2){
        for(let x=0;x<w;x+=2){
          if(data[(y*w+x)*4+3]>85){
            if(y<top)top=y;
            if(y>bottom)bottom=y;
          }
        }
      }
      if(bottom>=top)ratios.push((bottom-top+2)/h);
    }
    if(!ratios.length)return .76;
    ratios.sort((a,b)=>a-b);
    const mid=Math.floor(ratios.length/2);
    const typical=ratios.length%2?ratios[mid]:(ratios[mid-1]+ratios[mid])/2;
    return Math.min(.95,Math.max(.48,typical));
  }catch(_){return .76}
}
function box(a){let st=getComputedStyle(document.documentElement),n=x=>parseFloat(st.getPropertyValue(x))||0,e=5;return{l:n('--mascot-safe-left')+e,t:n('--mascot-safe-top')+e,r:innerWidth-n('--mascot-safe-right')-a.w-e,b:innerHeight-n('--mascot-safe-bottom')-a.h-e}}
function dir(a){return Math.abs(a.vx)>=Math.abs(a.vy)?(a.vx>=0?'right':'left'):(a.vy>=0?'down':'up')}
function row(d){return{right:0,left:1,down:2,up:3,idle:4}[d]??4}
function setV(a,ang=Math.atan2(a.vy,a.vx)){let v=speed[S.speed]||42;a.vx=Math.cos(ang)*v;a.vy=Math.sin(ang)*v;a.d=dir(a)}
function render(a,now){let m=metrics.get(a.id)||{fw:272,fh:217},pose=(S.lineup||now<a.pose||!S.moving)?'idle':a.d,sc=a.h/m.fh,f=a.frame%4,b=(pose==='idle'?0:[0,-4,0,-2][f]*Math.max(.65,Math.min(1.15,a.h/88)));a.el.style.width=a.w+'px';a.el.style.height=a.h+'px';a.el.style.setProperty('--mascot-image','url("'+sprite(a.id)+'")');a.el.style.setProperty('--mascot-sheet-width',(m.fw*4*sc)+'px');a.el.style.setProperty('--mascot-sheet-height',(m.fh*5*sc)+'px');a.el.style.setProperty('--mascot-frame-x',(-m.fw*f*sc)+'px');a.el.style.setProperty('--mascot-frame-y',(-m.fh*row(pose)*sc)+'px');a.el.style.transform='translate3d('+a.x+'px,'+(a.y+b)+'px,0)'}
function pose(a,now,ms=800){a.pose=Math.max(a.pose,now+ms);a.frame=Math.floor(Math.random()*4);a.el.classList.remove('mascot-collision-pose');void a.el.offsetWidth;a.el.classList.add('mascot-collision-pose');setTimeout(()=>a.el&&a.el.classList.remove('mascot-collision-pose'),ms)}
function bubble(a){if(!S.speech)return;let p=P[a.id]||[C[a.id][0]+'です！'];a.b.textContent=p[Math.floor(Math.random()*p.length)];a.b.hidden=false;a.b.style.left=Math.min(innerWidth-170,Math.max(8,a.x+a.w/2-80))+'px';a.b.style.top=Math.max(8,a.y-58)+'px';clearTimeout(a.bt);a.bt=setTimeout(()=>a.b.hidden=true,2600)}
function actor(id){let d=dims(id),el=document.createElement('button'),b=document.createElement('div');el.type='button';el.className='edge-mascot mascot-sprite mascot-actor';el.setAttribute('aria-label',C[id][0]+'マスコット');b.className='mascot-bubble mascot-actor-bubble';b.hidden=true;let a={id,el,b,w:d.w,h:d.h,x:0,y:0,vx:0,vy:0,d:'right',frame:0,lastF:0,pose:0,cool:0,bt:null};el.addEventListener('click',()=>{let n=performance.now();pose(a,n,1100);bubble(a)});layer.append(el,b);return a}
function loadMetric(id){return new Promise(res=>{let i=new Image();i.onload=()=>{const fw=i.naturalWidth/4,fh=i.naturalHeight/5;metrics.set(id,{fw,fh,visibleRatio:spriteVisibleRatio(i,fw,fh)});res(true)};i.onerror=()=>res(false);i.src=sprite(id)})}
async function rebuild(){actors.forEach(a=>{clearTimeout(a.bt);a.el.remove();a.b.remove()});actors=[];let ids=valid(S.selectedCharacters);if(!ids.length)ids=['shioriko'];S.selectedCharacters=ids;save();let ok=(await Promise.all(ids.map(async id=>[id,await loadMetric(id)]))).filter(x=>x[1]).map(x=>x[0]);if(!ok.length){await loadMetric('shioriko');ok=['shioriko']}ok.forEach(id=>actors.push(actor(id)));place();visible();syncStatus()}
function placeLineup(){
  const order=Object.keys(C);
  const sorted=[...actors].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  const inset=getComputedStyle(document.documentElement);
  const safeLeft=parseFloat(inset.getPropertyValue('--mascot-safe-left'))||0;
  const safeRight=parseFloat(inset.getPropertyValue('--mascot-safe-right'))||0;
  const left=Math.max(5,safeLeft+5);
  const right=Math.max(5,safeRight+5);
  const available=Math.max(1,innerWidth-left-right);
  const slot=available/Math.max(1,sorted.length);
  let maxHeight=0;
  sorted.forEach((a,i)=>{
    const d=dims(a.id);
    const fit=Math.min(1,Math.max(1,slot-3)/d.w);
    a.w=d.w*fit;
    a.h=d.h*fit;
    const q=box(a);
    a.x=Math.min(q.r,Math.max(q.l,left+(i+.5)*slot-a.w/2));
    a.y=q.b;
    a.d='down';a.vx=0;a.vy=0;a.pose=0;a.lastF=0;
    maxHeight=Math.max(maxHeight,a.h);
  });
  root.style.setProperty('--mascot-lineup-height',Math.ceil(maxHeight)+'px');
  root.classList.add('mascot-lineup-active');
}
function place(){
  if(S.lineup){placeLineup();return}
  root.classList.remove('mascot-lineup-active');
  root.style.setProperty('--mascot-lineup-height','0px');
  const multi=actors.length>1,cols=Math.max(2,Math.ceil(Math.sqrt(actors.length)));
  actors.forEach((a,i)=>{
    const d=dims(a.id);a.w=d.w;a.h=d.h;
    const q=box(a);
    if(multi){
      const rows=Math.ceil(actors.length/cols),c=i%cols,r=Math.floor(i/cols);
      a.x=q.l+(q.r-q.l)*(c+.5)/cols;
      a.y=q.t+(q.b-q.t)*(r+.5)/rows;
      setV(a,Math.random()*Math.PI*2);
    }else{
      a.x=q.l;a.y=q.b;a.d='right';a.vx=speed[S.speed]||42;a.vy=0;
    }
  });
}
function visible(){layer.hidden=!S.enabled||!actors.length;if(!S.speech)actors.forEach(a=>a.b.hidden=true)}
function wall(a,now){let q=box(a),hit=false;if(a.x<q.l){a.x=q.l;a.vx=Math.abs(a.vx);hit=true}else if(a.x>q.r){a.x=q.r;a.vx=-Math.abs(a.vx);hit=true}if(a.y<q.t){a.y=q.t;a.vy=Math.abs(a.vy);hit=true}else if(a.y>q.b){a.y=q.b;a.vy=-Math.abs(a.vy);hit=true}if(hit&&now>a.cool){setV(a,Math.atan2(a.vy,a.vx)+(Math.random()-.5)*.5);a.cool=now+650;pose(a,now,700)}}
function collide(now){for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){let a=actors[i],b=actors[j];if(now<a.cool||now<b.cool)continue;let ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2,dx=bx-ax,dy=by-ay,di=Math.hypot(dx,dy),mi=Math.min(a.w,a.h)*.32+Math.min(b.w,b.h)*.32;if(di>0&&di<mi){let nx=dx/di,ny=dy/di,o=mi-di;a.x-=nx*o/2;a.y-=ny*o/2;b.x+=nx*o/2;b.y+=ny*o/2;setV(a,Math.atan2(-ny,-nx)+(Math.random()-.5)*.7);setV(b,Math.atan2(ny,nx)+(Math.random()-.5)*.7);a.cool=b.cool=now+850;pose(a,now,850);pose(b,now,850)}}}
function single(a,dist,now){let q=box(a);if(a.d==='right'){a.x+=dist;if(a.x>=q.r){a.x=q.r;a.d='down';pose(a,now)}}else if(a.d==='down'){a.y+=dist;if(a.y>=q.b){a.y=q.b;a.d='left';pose(a,now)}}else if(a.d==='left'){a.x-=dist;if(a.x<=q.l){a.x=q.l;a.d='up';pose(a,now)}}else{a.y-=dist;if(a.y<=q.t){a.y=q.t;a.d='right';pose(a,now)}}}
function tick(now){
  const dt=Math.min(50,now-(last||now));last=now;
  if(S.enabled&&actors.length){
    if(S.lineup){
      actors.forEach(a=>{
        if(now-a.lastF>=850){a.frame=(a.frame+1)%4;a.lastF=now}
        render(a,now);
      });
    }else{
      const multi=actors.length>1,dist=(speed[S.speed]||42)*dt/1000;
      actors.forEach(a=>{
        const paused=now<a.pose||!S.moving;
        if(!paused){
          if(multi){
            a.x+=a.vx*dt/1000;a.y+=a.vy*dt/1000;
            wall(a,now);a.d=dir(a);
          }else single(a,dist,now);
        }
        const iv=paused?520:190;
        if(now-a.lastF>=iv){a.frame=(a.frame+1)%4;a.lastF=now}
      });
      if(multi&&S.moving)collide(now);
      actors.forEach(a=>render(a,now));
    }
  }
  requestAnimationFrame(tick);
}
function selected(){return[...dialog.querySelectorAll('[data-char]:checked')].map(x=>x.value)}
function syncStatus(msg=''){
  if(status)status.textContent=msg||(S.lineup?'画面下に整列中：移動せずポーズが変わります':S.selectedCharacters.length===1?'1人選択中：外周を歩きます':S.selectedCharacters.length+'人選択中：画面全体を自由に歩きます');
  if(lineupButton){
    lineupButton.textContent=S.lineup?'歩行':'整列';
    lineupButton.setAttribute('aria-label',S.lineup?'通常歩行に戻す':'キャラクターを画面下に一列に整列');
    lineupButton.setAttribute('aria-pressed',S.lineup?'true':'false');
  }
}
function sync(){dialog.querySelector('#mEnabled').checked=S.enabled;dialog.querySelector('#mMoving').checked=S.moving;dialog.querySelector('#mSpeech').checked=S.speech;dialog.querySelector('#mSize').value=S.size;dialog.querySelector('#mSpeed').value=S.speed;let set=new Set(S.selectedCharacters);dialog.querySelectorAll('[data-char]').forEach(x=>x.checked=set.has(x.value));syncStatus()}
function ui(){root=document.createElement('div');root.id=ROOT;root.className='mascot-root';layer=document.createElement('div');layer.className='mascot-layer';let gear=document.createElement('button');gear.type='button';gear.className='mascot-settings-btn';gear.textContent='⚙';
  lineupButton=document.createElement('button');
  lineupButton.type='button';
  lineupButton.className='mascot-lineup-btn';
  lineupButton.textContent='整列';
  lineupButton.addEventListener('click',()=>{
    S.lineup=!S.lineup;save();place();syncStatus();
    actors.forEach(a=>render(a,performance.now()));
  });
  dialog=document.createElement('dialog');dialog.className='mascot-dialog';dialog.innerHTML='<form method="dialog" class="mascot-dialog-card"><header class="mascot-dialog-head"><div><h2>マスコット設定</h2><p>1人なら外周、2人以上なら画面全体を自由に歩きます。</p></div><button class="ghost-btn" value="close">閉じる</button></header><section class="mascot-character-panel"><div class="mascot-character-head"><span>表示するキャラクター</span><div class="mascot-character-actions"><button id="mAll" type="button">全員</button><button id="mOne" type="button">1人にする</button></div></div><div class="mascot-character-grid">'+Object.entries(C).map(([id,v])=>'<label class="mascot-character-chip"><input type="checkbox" value="'+id+'" data-char><span>'+v[0]+'</span></label>').join('')+'</div><p id="mStatus" class="mascot-selection-status"></p></section><div class="mascot-setting-grid"><label class="mascot-switch"><span>マスコットを表示</span><input id="mEnabled" type="checkbox"></label><label class="mascot-switch"><span>動かす</span><input id="mMoving" type="checkbox"></label><label class="mascot-switch"><span>セリフを表示</span><input id="mSpeech" type="checkbox"></label><label><span>大きさ</span><select id="mSize"><option value="small">小</option><option value="medium">中</option><option value="large">大</option></select></label><label><span>速度</span><select id="mSpeed"><option value="slow">ゆっくり</option><option value="normal">普通</option><option value="fast">速い</option></select></label></div></form>';status=dialog.querySelector('#mStatus');gear.addEventListener('click',()=>{sync();dialog.showModal?dialog.showModal():dialog.setAttribute('open','')});root.append(layer,lineupButton,gear,dialog);document.body.append(root);dialog.querySelector('#mEnabled').onchange=e=>{S.enabled=e.target.checked;save();visible()};dialog.querySelector('#mMoving').onchange=e=>{S.moving=e.target.checked;save()};dialog.querySelector('#mSpeech').onchange=e=>{S.speech=e.target.checked;save();visible()};dialog.querySelector('#mSize').onchange=async e=>{S.size=e.target.value;save();await rebuild();sync()};dialog.querySelector('#mSpeed').onchange=e=>{S.speed=e.target.value;actors.forEach(a=>setV(a));save()};dialog.querySelectorAll('[data-char]').forEach(x=>x.onchange=async()=>{let s=selected();if(!s.length){x.checked=true;syncStatus('最低1人は選択してください');return}S.selectedCharacters=s;save();await rebuild();sync()});dialog.querySelector('#mAll').onclick=async()=>{S.selectedCharacters=Object.keys(C);save();await rebuild();sync()};dialog.querySelector('#mOne').onclick=async()=>{S.selectedCharacters=[S.selectedCharacters[0]||'shioriko'];save();await rebuild();sync()}}
async function init(){document.querySelectorAll('#'+ROOT).forEach(x=>x.remove());ui();sync();await rebuild();addEventListener('resize',()=>{
 if(S.lineup){placeLineup();return}
 actors.forEach(a=>{let d=dims(a.id);a.w=d.w;a.h=d.h;let q=box(a);a.x=Math.min(q.r,Math.max(q.l,a.x));a.y=Math.min(q.b,Math.max(q.t,a.y))})
},{passive:true});requestAnimationFrame(tick)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();