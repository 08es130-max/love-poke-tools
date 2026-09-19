import {getFirebaseContext} from './firebase-client.js';
const $=selector=>document.querySelector(selector);
const SCHEMA_VERSION=1;
const ACTIVE_PATH=['lovepoke','active-tournament'];
const LEGACY_PLAYER_IDS=new Map([['たくみ','player-takumi'],['ひろき','player-hiroki'],['はせ','player-hase'],['馬場っち','player-babacchi'],['隆一','player-ryuichi']]);
let cloud=null;
let activeTournament=null;
let completedTournaments=[];
let saving=false;
let pendingSave=null;

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}
function uid(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function today(){
  const date=new Date(),pad=value=>String(value).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}
function normalizeTournament(raw){
  if(!raw||Number(raw.schemaVersion||1)>SCHEMA_VERSION)return null;
  // Version 1 is currently the only format. Defaults keep partially written
  // documents readable and provide the migration entry point for later versions.
  return {
    ...raw,
    schemaVersion:SCHEMA_VERSION,
    players:Array.isArray(raw.players)?raw.players.map(player=>{
      const displayName=player.displayName||player.name||'';
      const currentId=window.getLovePokeBasePlayers?.().find(item=>item.displayName===displayName)?.playerId;
      const playerId=player.playerId||LEGACY_PLAYER_IDS.get(displayName)||currentId||player.id;
      return {...player,id:player.id||playerId,playerId,displayName,name:displayName};
    }):[],
    matches:Array.isArray(raw.matches)?raw.matches:[],
    finalStandings:Array.isArray(raw.finalStandings)?raw.finalStandings:[]
  };
}
function setCloudStatus(kind,title,text){
  const badge=$('#cloudStatusBadge');
  badge.textContent=title;
  badge.className=`badge ${kind}`;
  $('#cloudStatusText').textContent=text;
}

function sourceParticipants(){
  return window.getLovePokeTournamentParticipants?.()||[];
}
function renderSourceParticipants(){
  const players=sourceParticipants();
  $('#tournamentSourcePlayers').innerHTML=players.map((player,index)=>`
    <div class="source-player">
      <strong>${index+1}. ${escapeHtml(player.name)}</strong>
      <span>${player.pokemon.length?player.pokemon.map(p=>`<button type="button" class="poke-guide-link inline" data-poke-guide-id="${escapeHtml(p.id||p.name)}">${escapeHtml(p.name)}</button>`).join('・'):'ポケモン未抽選'}</span>
    </div>`).join('');
}

document.querySelectorAll('.poke-tab').forEach(button=>{
  button.addEventListener('click',()=>{
    const pane=button.dataset.pokePane;
    document.querySelectorAll('.poke-tab').forEach(x=>x.classList.toggle('active',x===button));
    document.querySelectorAll('.poke-pane').forEach(x=>x.classList.add('hidden'));
    $(`#poke${pane[0].toUpperCase()}${pane.slice(1)}Pane`).classList.remove('hidden');
    if(pane==='tournament')renderSourceParticipants();
  });
});

function createLeagueMatches(players){
  const matches=[];
  for(let a=0;a<players.length;a++){
    for(let b=a+1;b<players.length;b++){
      matches.push({id:uid(),type:'league',round:0,groupId:'league',a:players[a].id,b:players[b].id,winner:null});
    }
  }
  return matches;
}
function playerById(tournament,id){return tournament.players.find(player=>player.id===id)}
function matchesOf(tournament,type){return tournament.matches.filter(match=>match.type===type)}
function recordFor(tournament,playerId,matches=tournament.matches){
  let wins=0,losses=0;
  for(const match of matches){
    if(!match.winner||!([match.a,match.b].includes(playerId)))continue;
    if(match.winner===playerId)wins++;else losses++;
  }
  return {wins,losses};
}
function leagueWins(tournament,playerId){
  return recordFor(tournament,playerId,matchesOf(tournament,'league')).wins;
}
function suddenRounds(tournament,groupId){
  return [...new Set(matchesOf(tournament,'suddenDeath').filter(m=>m.groupId===groupId).map(m=>m.round))].sort((a,b)=>a-b);
}
function rankingKey(tournament,playerId){
  const wins=leagueWins(tournament,playerId);
  const groupId=`wins-${wins}`;
  const sudden=suddenRounds(tournament,groupId).map(round=>
    recordFor(tournament,playerId,tournament.matches.filter(m=>m.type==='suddenDeath'&&m.groupId===groupId&&m.round===round)).wins
  );
  return [wins,...sudden];
}
function compareKeys(a,b){
  const length=Math.max(a.length,b.length);
  for(let i=0;i<length;i++){
    const diff=(b[i]??0)-(a[i]??0);
    if(diff)return diff;
  }
  return 0;
}
function sortedPlayers(tournament){
  return [...tournament.players].sort((a,b)=>compareKeys(rankingKey(tournament,a.id),rankingKey(tournament,b.id)));
}
function unresolvedTieGroups(tournament){
  const groups=new Map();
  for(const player of tournament.players){
    const key=rankingKey(tournament,player.id).join(':');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(player.id);
  }
  return [...groups.values()].filter(ids=>ids.length>1);
}
function allMatchesComplete(tournament,type='all'){
  return tournament.matches.filter(m=>type==='all'||m.type===type).every(match=>!!match.winner);
}
function standingRows(tournament,final=false){
  const ordered=final&&tournament.finalStandings?.length
    ? tournament.finalStandings.map(id=>playerById(tournament,id)).filter(Boolean)
    : sortedPlayers(tournament);
  return ordered.map((player,index)=>{
    const record=recordFor(tournament,player.id);
    const previous=index&&compareKeys(rankingKey(tournament,ordered[index-1].id),rankingKey(tournament,player.id))===0;
    const rank=previous?'同率':`${index+1}位`;
    return {player,record,rank};
  });
}

function tournamentPokemonHtml(players){
  return players.map(player=>`
    <div class="source-player tournament-party">
      <strong>${escapeHtml(player.name)}</strong>
      <span>${Array.isArray(player.pokemon)&&player.pokemon.length?player.pokemon.map(p=>`<button type="button" class="poke-guide-link inline" data-poke-guide-id="${escapeHtml(p.id||p.name)}">${escapeHtml(p.name)}</button>`).join('・'):'ポケモン未登録'}</span>
    </div>`).join('');
}

const TYPE_CHART={
  Normal:{Rock:.5,Ghost:0,Steel:.5},Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},
  Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},
  Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},
  Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},
  Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},
  Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},
  Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},
  Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},
  Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},
  Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},
  Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},
  Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},
  Dragon:{Dragon:2,Steel:.5,Fairy:0},
  Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},
  Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
  Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}
};
const ALL_TYPES=Object.keys(TYPE_CHART);

function typeEffectiveness(attackType,defenderTypes){
  return defenderTypes.reduce((mult,type)=>mult*(TYPE_CHART[attackType]?.[type]??1),1);
}
function finalPokemonForAnalysis(p){
  const list=window.getLovePokeFinalEvolutionList?.(p)||[];
  const candidates=list.length?list:[p];
  return candidates.reduce((best,item)=>{
    const bst=window.POKEMON_STATS?.[String(item.id)]?.bst??0;
    const bestBst=window.POKEMON_STATS?.[String(best.id)]?.bst??0;
    return bst>bestBst?item:best;
  },candidates[0]);
}
function pokemonAnalysisProfile(p){
  const final=finalPokemonForAnalysis(p);
  const key=final.formKey?`${final.id}-${final.formKey}`:String(final.id);
  const stat=window.POKEMON_STATS?.[String(final.id)]||{};
  return {
    source:p,final,
    bst:Number(stat.bst)||0,
    speed:Number(stat.speed)||0,
    types:window.POKEMON_TYPES?.[key]||window.POKEMON_TYPES?.[String(final.id)]||[]
  };
}
function usageCoefficientFor(mon){
  const rate=Number(window.POKEMON_USAGE_RATES?.[String(mon.final.id)]||0);
  // Usage is a supporting signal, not the main strength score.
  // 0% => x1.000, current top usage (~43%) => about x1.060.
  const coefficient=1+0.06*(Math.log1p(rate)/Math.log1p(43));
  return {rate,coefficient};
}
function partyAnalysis(player){
  const mons=(player.pokemon||[]).map(pokemonAnalysisProfile);
  if(!mons.length)return {mons,score:0,baseScore:0,avgBst:0,avgSpeed:0,coverage:0,maxWeak:0,weakTypes:[],usageCoefficient:1,usageAverage:0};
  const avgBst=mons.reduce((s,p)=>s+p.bst,0)/mons.length;
  const avgSpeed=mons.reduce((s,p)=>s+p.speed,0)/mons.length;
  const stabTypes=[...new Set(mons.flatMap(p=>p.types))];
  const coverage=ALL_TYPES.filter(def=>stabTypes.some(atk=>typeEffectiveness(atk,[def])>1)).length;
  const weaknessRows=ALL_TYPES.map(atk=>({
    type:atk,
    count:mons.filter(mon=>typeEffectiveness(atk,mon.types)>1).length
  })).sort((a,b)=>b.count-a.count);
  const maxWeak=weaknessRows[0]?.count||0;
  const weakTypes=weaknessRows.filter(x=>x.count===maxWeak&&x.count>=2).map(x=>x.type);
  const baseScore=50+(avgBst-480)*.10+(avgSpeed-70)*.07+(coverage-8)*1.15-(Math.max(0,maxWeak-2))*2.2;
  const usageRows=mons.map(usageCoefficientFor);
  const usageCoefficient=usageRows.reduce((s,x)=>s+x.coefficient,0)/usageRows.length;
  const usageAverage=usageRows.reduce((s,x)=>s+x.rate,0)/usageRows.length;
  const score=baseScore*usageCoefficient;
  return {mons,score,baseScore,avgBst,avgSpeed,coverage,maxWeak,weakTypes,usageCoefficient,usageAverage};
}
function offensivePressure(a,b){
  if(!a.mons.length||!b.mons.length)return .5;
  const hit=b.mons.filter(target=>a.mons.some(attacker=>attacker.types.some(type=>typeEffectiveness(type,target.types)>1))).length;
  return hit/b.mons.length;
}
function matchupProbability(a,b){
  const power=(a.score-b.score)*.075;
  const coverage=(offensivePressure(a,b)-offensivePressure(b,a))*1.8;
  return 1/(1+Math.exp(-(power+coverage)));
}
function tournamentForecast(tournament){
  const rows=tournament.players.map(player=>({player,analysis:partyAnalysis(player)}));
  if(rows.length<2)return rows.map(row=>({...row,probability:1,odds:1}));
  rows.forEach(row=>{
    const opponents=rows.filter(x=>x!==row);
    row.strength=opponents.reduce((sum,opp)=>sum+matchupProbability(row.analysis,opp.analysis),0)/opponents.length;
  });
  const weights=rows.map(row=>Math.exp((row.strength-.5)*5));
  const total=weights.reduce((a,b)=>a+b,0)||1;
  rows.forEach((row,i)=>{
    row.probability=weights[i]/total;
    row.odds=row.probability?1/row.probability:0;
  });
  return rows.sort((a,b)=>b.probability-a.probability);
}
function forecastHtml(tournament){
  if(!window.POKEMON_TYPES||!window.POKEMON_STATS)return '<p class="note">戦力データを読み込み中です。</p>';
  const rows=tournamentForecast(tournament);
  if(rows.some(row=>!row.analysis.mons.length))return '<p class="note">使用ポケモンが登録されると予想を表示します。</p>';
  const usageMeta=window.POKEMON_USAGE_META;
  const usageText=usageMeta?` ／ 使用率補正：${escapeHtml(usageMeta.format)}（${escapeHtml(usageMeta.capturedAt)}取得）`:'';
  return `<div class="forecast-note">最終進化後を想定。BST・素早さ・タイプ一致攻撃範囲・弱点重複・参加パーティ同士の相性から算出した参考値です。${usageText}</div>
    <div class="forecast-list">${rows.map((row,index)=>{
      const a=row.analysis;
      const weakness=a.weakTypes.length?`弱点重複：${a.weakTypes.join('・')} ${a.maxWeak}匹`:'弱点重複：小';
      return `<article class="forecast-card">
        <div class="forecast-rank">${index+1}番人気</div>
        <div class="forecast-main"><strong>${escapeHtml(row.player.name)}</strong><span>予想優勝率 ${(row.probability*100).toFixed(1)}%</span></div>
        <div class="forecast-odds">${row.odds.toFixed(1)}倍</div>
        <div class="forecast-stats">戦力 ${a.score.toFixed(1)} ／ 平均BST ${a.avgBst.toFixed(0)} ／ 平均S ${a.avgSpeed.toFixed(0)} ／ 一致弱点範囲 ${a.coverage}/18 ／ 使用率補正 ×${a.usageCoefficient.toFixed(3)} ／ ${escapeHtml(weakness)}</div>
      </article>`;
    }).join('')}</div>`;
}

async function saveActive(){
  if(!cloud||!activeTournament)return;
  activeTournament.updatedAt=new Date().toISOString();
  pendingSave=JSON.parse(JSON.stringify(activeTournament));
  if(saving)return;
  saving=true;
  try{
    while(pendingSave){
      const snapshot=pendingSave;
      pendingSave=null;
      await cloud.setActive(snapshot);
    }
    setCloudStatus('ok','同期済み','大会データはクラウドへ自動保存されています。');
  }catch(error){
    setCloudStatus('warn','保存エラー',`保存できませんでした：${error.message}`);
  }finally{
    saving=false;
    if(pendingSave)saveActive();
  }
}
function scheduleSave(){saveActive()}

function matchHtml(tournament,match){
  const a=playerById(tournament,match.a),b=playerById(tournament,match.b);
  return `<div class="match-card ${match.winner?'played':'unplayed'}">
    <div class="match-status">${match.winner?'入力済み':'未対戦'}</div>
    <div class="match-buttons">
      <button type="button" data-match="${match.id}" data-winner="${a.id}" class="winner-btn ${match.winner===a.id?'selected':''}">${escapeHtml(a.name)} 勝利</button>
      <span>vs</span>
      <button type="button" data-match="${match.id}" data-winner="${b.id}" class="winner-btn ${match.winner===b.id?'selected':''}">${escapeHtml(b.name)} 勝利</button>
    </div>
    ${match.winner?`<button type="button" class="clear-result" data-clear-match="${match.id}">結果を取消</button>`:''}
  </div>`;
}
function renderActiveTournament(){
  const setup=$('#tournamentSetupPanel'),area=$('#activeTournamentArea');
  if(!activeTournament){setup.classList.remove('hidden');area.innerHTML='';return}
  setup.classList.add('hidden');
  const tournament=activeTournament;
  const league=matchesOf(tournament,'league');
  const sudden=matchesOf(tournament,'suddenDeath');
  const ties=allMatchesComplete(tournament)?unresolvedTieGroups(tournament):[];
  area.innerHTML=`
    <section class="panel tournament-head-panel">
      <div class="section-title-row"><h2>開催中大会</h2><span class="badge ok">リアルタイム同期</span></div>
      <label class="block-label">大会名<input id="activeTournamentName" type="text" value="${escapeHtml(tournament.name)}"></label>
      <div class="tournament-meta">開催日：${escapeHtml(tournament.heldDate)} ／ ${tournament.players.length}人</div>
      <div class="tournament-actions"><button id="finishTournamentBtn" class="primary-btn">順位を確定して終了</button><button id="deleteTournamentBtn" class="danger-btn">大会を削除</button></div>
    </section>
    <section class="panel"><h2>暫定順位</h2><div class="standings-table">${standingRows(tournament).map(row=>`
      <div class="standing-row"><strong>${row.rank}</strong><span>${escapeHtml(row.player.name)}</span><span>${row.record.wins}勝 ${row.record.losses}敗</span></div>`).join('')}</div></section>
    <section class="panel forecast-panel"><div class="section-title-row"><h2>AI優勝予想</h2><span class="badge soft">参考オッズ</span></div>${forecastHtml(tournament)}</section>
    <section class="panel"><h2>使用ポケモン</h2><div class="tournament-pokemon-list">${tournamentPokemonHtml(tournament.players)}</div></section>
    <section class="panel"><div class="section-title-row"><h2>通常リーグ</h2><span class="badge ${allMatchesComplete(tournament,'league')?'ok':'warn'}">${league.filter(m=>m.winner).length}/${league.length}試合</span></div>${league.map(m=>matchHtml(tournament,m)).join('')}</section>
    <section class="panel"><div class="section-title-row"><h2>サドンデス</h2><span class="badge soft">${sudden.length}試合</span></div>
      ${sudden.length?sudden.map(m=>`<div class="sudden-label">第${m.round}ラウンド</div>${matchHtml(tournament,m)}`).join(''):'<p class="note">通常リーグ終了後、同勝利数のグループに追加できます。</p>'}
      ${ties.map(ids=>`<button type="button" class="wide-btn add-sudden-btn" data-players="${ids.join(',')}">${ids.map(id=>escapeHtml(playerById(tournament,id).name)).join('・')}のサドンデスを追加</button>`).join('')}
    </section>`;
  area.querySelectorAll('[data-match]').forEach(button=>button.onclick=()=>setWinner(button.dataset.match,button.dataset.winner));
  area.querySelectorAll('[data-clear-match]').forEach(button=>button.onclick=()=>setWinner(button.dataset.clearMatch,null));
  area.querySelectorAll('.add-sudden-btn').forEach(button=>button.onclick=()=>addSuddenDeath(button.dataset.players.split(',')));
  $('#activeTournamentName').onchange=event=>{tournament.name=event.target.value.trim()||'名称未設定';scheduleSave()};
  $('#finishTournamentBtn').onclick=finishTournament;
  $('#deleteTournamentBtn').onclick=deleteActiveTournament;
}

function setWinner(matchId,winner){
  const match=activeTournament.matches.find(item=>item.id===matchId);
  if(!match)return;
  match.winner=winner;
  renderActiveTournament();
  scheduleSave();
}
function addSuddenDeath(ids){
  if(!allMatchesComplete(activeTournament)){
    alert('未入力の試合を完了してから次のサドンデスを追加してください。');return;
  }
  const wins=leagueWins(activeTournament,ids[0]);
  const groupId=`wins-${wins}`;
  const round=Math.max(0,...suddenRounds(activeTournament,groupId))+1;
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
    activeTournament.matches.push({id:uid(),type:'suddenDeath',round,groupId,a:ids[a],b:ids[b],winner:null});
  }
  renderActiveTournament();scheduleSave();
}

$('#startTournamentBtn').onclick=async()=>{
  if(!cloud){alert('先にFirebase設定を完了してください。');return}
  if(activeTournament){alert('開催中の大会があります。終了または削除してから開始してください。');return}
  const source=sourceParticipants();
  if(source.length<2){alert('大会には2人以上必要です。');return}
  const players=source.map(player=>({id:player.playerId,playerId:player.playerId,displayName:player.displayName,name:player.displayName,pokemon:JSON.parse(JSON.stringify(player.pokemon))}));
  const tournament={schemaVersion:SCHEMA_VERSION,id:uid(),name:$('#newTournamentName').value.trim()||`${today()} LovePoke大会`,heldDate:today(),status:'active',players,matches:[],finalStandings:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  tournament.matches=createLeagueMatches(players);
  try{await cloud.createActive(tournament)}catch(error){alert(error.message)}
};
async function deleteActiveTournament(){
  if(!confirm(`開催中の「${activeTournament.name}」を削除しますか？\nこの操作は取り消せません。`))return;
  try{await cloud.deleteActive(activeTournament.id)}catch(error){alert(error.message)}
}
async function finishTournament(){
  if(!allMatchesComplete(activeTournament)){alert('未入力の試合があります。');return}
  if(unresolvedTieGroups(activeTournament).length){alert('同率の参加者がいます。必要なサドンデスを追加してください。');return}
  if(!confirm(`「${activeTournament.name}」の最終順位を確定し、大会を終了しますか？`))return;
  const ended={...activeTournament,status:'completed',finalStandings:sortedPlayers(activeTournament).map(p=>p.id),completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  try{await cloud.complete(ended)}catch(error){alert(error.message)}
}

function completedRecord(tournament,playerId){
  const includeSudden=$('#includeSuddenInStats')?.checked!==false;
  return recordFor(tournament,playerId,tournament.matches.filter(match=>includeSudden||match.type==='league'));
}
function percent(wins,total){return total?`${(wins/total*100).toFixed(1)}%`:'—'}
function renderHistory(){
  $('#historyCountBadge').textContent=`${completedTournaments.length}大会`;
  const careers=new Map();
  for(const tournament of completedTournaments){
    tournament.players.forEach(player=>{
      const key=player.playerId||player.id;
      if(!careers.has(key))careers.set(key,{id:key,name:player.displayName||player.name,events:0,first:0,second:0,third:0,wins:0,losses:0,ranks:[]});
      const stat=careers.get(key),rank=tournament.finalStandings.indexOf(player.id)+1,record=completedRecord(tournament,player.id);
      stat.events++;stat.wins+=record.wins;stat.losses+=record.losses;stat.ranks.push(rank);
      if(rank===1)stat.first++;if(rank===2)stat.second++;if(rank===3)stat.third++;
    });
  }
  const stats=[...careers.values()].sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  $('#careerStats').innerHTML=stats.length?stats.map(s=>`<article class="career-card"><h3>${escapeHtml(s.name)}</h3><div>${s.events}大会 ／ 優勝${s.first}回・2位${s.second}回・3位${s.third}回</div><div>${s.wins}勝 ${s.losses}敗 ／ 勝率 ${percent(s.wins,s.wins+s.losses)}</div><div>平均順位 ${(s.ranks.reduce((a,b)=>a+b,0)/s.ranks.length).toFixed(2)}位 ／ 最高 ${Math.min(...s.ranks)}位</div></article>`).join(''):'<p class="note">終了済み大会はまだありません。</p>';
  const select=$('#headToHeadPlayer'),selected=select.value;
  select.innerHTML='<option value="">プレイヤーを選択</option>'+stats.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
  if(stats.some(s=>s.id===selected))select.value=selected;
  renderHeadToHead();
  $('#pastTournamentList').innerHTML=completedTournaments.length?completedTournaments.map(t=>`<button type="button" class="past-tournament-btn" data-past-id="${t.id}"><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.heldDate)}・${t.players.length}人</span></button>`).join(''):'<p class="note">過去大会はありません。</p>';
  document.querySelectorAll('[data-past-id]').forEach(button=>button.onclick=()=>renderPastDetail(button.dataset.pastId));
}
$('#headToHeadPlayer').onchange=renderHeadToHead;
$('#includeSuddenInStats').onchange=renderHistory;
function renderHeadToHead(){
  const selected=$('#headToHeadPlayer').value,records=new Map();
  if(!selected){$('#headToHeadStats').innerHTML='<p class="note">プレイヤーを選択してください。</p>';return}
  for(const tournament of completedTournaments){
    const player=tournament.players.find(p=>(p.playerId||p.id)===selected);if(!player)continue;
    for(const match of tournament.matches){
      if($('#includeSuddenInStats')?.checked===false&&match.type==='suddenDeath')continue;
      if(!match.winner||![match.a,match.b].includes(player.id))continue;
      const opponent=playerById(tournament,match.a===player.id?match.b:match.a);
      const opponentId=opponent.playerId||opponent.id;
      if(!records.has(opponentId))records.set(opponentId,{name:opponent.name,leagueW:0,leagueL:0,suddenW:0,suddenL:0});
      const stat=records.get(opponentId),won=match.winner===player.id,prefix=match.type==='league'?'league':'sudden';
      stat[`${prefix}${won?'W':'L'}`]++;
    }
  }
  const selectedName=completedTournaments.flatMap(t=>t.players).find(p=>(p.playerId||p.id)===selected)?.name||selected;
  $('#headToHeadStats').innerHTML=[...records.values()].map(s=>{const wins=s.leagueW+s.suddenW,losses=s.leagueL+s.suddenL;return `<article class="career-card"><h3>${escapeHtml(selectedName)} vs ${escapeHtml(s.name)}</h3><div>通算 ${wins+losses}戦${wins}勝${losses}敗 ／ 勝率 ${percent(wins,wins+losses)}</div><div>通常リーグ ${s.leagueW}勝${s.leagueL}敗 ／ サドンデス ${s.suddenW}勝${s.suddenL}敗</div></article>`}).join('')||'<p class="note">対戦記録はありません。</p>';
}
function renderPastDetail(id){
  const t=completedTournaments.find(item=>item.id===id);if(!t)return;
  $('#pastTournamentDetail').innerHTML=`<article class="past-detail"><label class="block-label">大会名<input id="pastTournamentName" type="text" value="${escapeHtml(t.name)}"></label><div>開催日：${escapeHtml(t.heldDate)}</div><h4>最終順位</h4>${standingRows(t,true).map(row=>{const savedRecord=recordFor(t,row.player.id);return `<div>${row.rank} ${escapeHtml(row.player.name)}（${savedRecord.wins}勝${savedRecord.losses}敗）</div>`}).join('')}<h4>大会前AI予想</h4><div class="past-forecast">${forecastHtml(t)}</div><h4>使用ポケモン</h4><div class="tournament-pokemon-list">${tournamentPokemonHtml(t.players)}</div><h4>全対戦結果</h4>${t.matches.map(m=>{const a=playerById(t,m.a),b=playerById(t,m.b),winner=playerById(t,m.winner);return `<div class="past-match"><span>${m.type==='league'?'通常':'サドンデス'}</span> ${escapeHtml(a.name)} vs ${escapeHtml(b.name)} — ${escapeHtml(winner.name)}勝利</div>`}).join('')}<button type="button" id="deletePastBtn" class="danger-btn">この大会ログを削除</button></article>`;
  $('#pastTournamentName').onchange=async event=>{t.name=event.target.value.trim()||'名称未設定';t.updatedAt=new Date().toISOString();await cloud.setCompleted(t);renderHistory()};
  $('#deletePastBtn').onclick=async()=>{if(confirm(`「${t.name}」の大会ログを削除しますか？`))await cloud.deleteCompleted(t.id)};
}

async function initializeCloud(){
  const config=window.LOVEPOKE_FIREBASE_CONFIG;
  if(!config){setCloudStatus('warn','未設定','firebase-config.jsへFirebase設定を入力すると大会機能を利用できます。');$('#startTournamentBtn').disabled=true;return}
  let context;
  try{context=await getFirebaseContext()}catch(error){setCloudStatus('warn','読込エラー',`Firebase SDKを読み込めません：${error.message}`);return}
  const {db,firestore:{doc,collection,onSnapshot,setDoc,deleteDoc,runTransaction}}=context;
  try{
    const activeRef=doc(db,...ACTIVE_PATH),historyRef=collection(db,'tournaments');
    cloud={
      createActive:async tournament=>{
        await runTransaction(db,async transaction=>{
          if((await transaction.get(activeRef)).exists())throw new Error('開催中の大会があります。');
          transaction.set(activeRef,tournament);
        });
      },
      setActive:tournament=>runTransaction(db,async transaction=>{
        const current=await transaction.get(activeRef);
        if(!current.exists()||current.data().id!==tournament.id)throw new Error('開催中の大会が変更されています。');
        transaction.set(activeRef,tournament);
      }),
      deleteActive:expectedId=>runTransaction(db,async transaction=>{
        const current=await transaction.get(activeRef);
        if(!current.exists()||current.data().id!==expectedId)throw new Error('開催中の大会が変更されています。');
        transaction.delete(activeRef);
      }),
      complete:tournament=>runTransaction(db,async transaction=>{
        const current=await transaction.get(activeRef);
        if(!current.exists()||current.data().id!==tournament.id)throw new Error('開催中の大会が変更されています。');
        transaction.set(doc(historyRef,tournament.id),tournament);
        transaction.delete(activeRef);
      }),
      setCompleted:tournament=>setDoc(doc(historyRef,tournament.id),tournament),
      deleteCompleted:id=>deleteDoc(doc(historyRef,id))
    };
    onSnapshot(activeRef,snapshot=>{
      const incoming=snapshot.exists()?normalizeTournament(snapshot.data()):null;
      if(!incoming||!activeTournament||!pendingSave||(incoming.updatedAt||'')>=(activeTournament.updatedAt||''))activeTournament=incoming;
      renderActiveTournament();setCloudStatus('ok','同期中','他の端末で行われた変更も自動的に反映されます。');
    },error=>setCloudStatus('warn','同期エラー',error.message));
    onSnapshot(historyRef,snapshot=>{completedTournaments=snapshot.docs.map(item=>normalizeTournament(item.data())).filter(Boolean).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));renderHistory()},error=>setCloudStatus('warn','履歴エラー',error.message));
  }catch(error){setCloudStatus('warn','接続エラー',`Firebaseへ接続できません：${error.message}`)}
}

renderSourceParticipants();
renderActiveTournament();
renderHistory();
initializeCloud();
