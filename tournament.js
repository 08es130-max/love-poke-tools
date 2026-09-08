import {getFirebaseContext} from './firebase-client.js';

const $=selector=>document.querySelector(selector);
const SCHEMA_VERSION=1;
const ACTIVE_PATH=['lovepoke','active-tournament'];

const LEGACY_PLAYER_IDS=new Map([
  ['たくみ','player-takumi'],
  ['ひろき','player-hiroki'],
  ['はせ','player-hase'],
  ['馬場っち','player-babacchi'],
  ['隆一','player-ryuichi']
]);

let cloud=null;
let activeTournament=null;
let completedTournaments=[];
let saving=false;
let pendingSave=null;

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[char]));
}

function uid(){
  return crypto.randomUUID?.()||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today(){
  const date=new Date();
  const pad=value=>String(value).padStart(2,'0');

  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

function normalizeTournament(raw){
  if(!raw||Number(raw.schemaVersion||1)>SCHEMA_VERSION)return null;

  return {
    ...raw,
    schemaVersion:SCHEMA_VERSION,

    players:Array.isArray(raw.players)
      ? raw.players.map(player=>{
          const displayName=player.displayName||player.name||'';

          const currentId=
            window.getLovePokeBasePlayers?.()
              .find(item=>item.displayName===displayName)
              ?.playerId;

          const playerId=
            player.playerId||
            LEGACY_PLAYER_IDS.get(displayName)||
            currentId||
            player.id;

          return {
            ...player,
            id:player.id||playerId,
            playerId,
            displayName,
            name:displayName
          };
        })
      :[],

    matches:Array.isArray(raw.matches)?raw.matches:[],
    finalStandings:Array.isArray(raw.finalStandings)
      ?raw.finalStandings
      :[]
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

  $('#tournamentSourcePlayers').innerHTML=
    players.map((player,index)=>`
      <div class="source-player">
        <strong>${index+1}. ${escapeHtml(player.name)}</strong>
        <span>${
          player.pokemon.length
            ?player.pokemon.map(p=>escapeHtml(p.name)).join('・')
            :'ポケモン未抽選'
        }</span>
      </div>
    `).join('');
}

document.querySelectorAll('.poke-tab').forEach(button=>{
  button.addEventListener('click',()=>{
    const pane=button.dataset.pokePane;

    document.querySelectorAll('.poke-tab')
      .forEach(x=>x.classList.toggle('active',x===button));

    document.querySelectorAll('.poke-pane')
      .forEach(x=>x.classList.add('hidden'));

    $(`#poke${pane[0].toUpperCase()}${pane.slice(1)}Pane`)
      .classList.remove('hidden');

    if(pane==='tournament'){
      renderSourceParticipants();
    }
  });
});

function createLeagueMatches(players){
  const matches=[];

  for(let a=0;a<players.length;a++){
    for(let b=a+1;b<players.length;b++){
      matches.push({
        id:uid(),
        type:'league',
        round:0,
        groupId:'league',
        a:players[a].id,
        b:players[b].id,
        winner:null
      });
    }
  }

  return matches;
}

function playerById(tournament,id){
  return tournament.players.find(player=>player.id===id);
}

function matchesOf(tournament,type){
  return tournament.matches.filter(match=>match.type===type);
}

function recordFor(
  tournament,
  playerId,
  matches=tournament.matches
){
  let wins=0;
  let losses=0;

  for(const match of matches){
    if(
      !match.winner||
      ![match.a,match.b].includes(playerId)
    ){
      continue;
    }

    if(match.winner===playerId){
      wins++;
    }else{
      losses++;
    }
  }

  return {wins,losses};
}

function leagueWins(tournament,playerId){
  return recordFor(
    tournament,
    playerId,
    matchesOf(tournament,'league')
  ).wins;
}

function suddenRounds(tournament,groupId){
  return [
    ...new Set(
      matchesOf(tournament,'suddenDeath')
        .filter(m=>m.groupId===groupId)
        .map(m=>m.round)
    )
  ].sort((a,b)=>a-b);
}

function rankingKey(tournament,playerId){
  const wins=leagueWins(tournament,playerId);
  const groupId=`wins-${wins}`;

  const sudden=suddenRounds(tournament,groupId)
    .map(round=>
      recordFor(
        tournament,
        playerId,
        tournament.matches.filter(
          m=>
            m.type==='suddenDeath'&&
            m.groupId===groupId&&
            m.round===round
        )
      ).wins
    );

  return [wins,...sudden];
}

function compareKeys(a,b){
  const length=Math.max(a.length,b.length);

  for(let i=0;i<length;i++){
    const diff=(b[i]??0)-(a[i]??0);

    if(diff){
      return diff;
    }
  }

  return 0;
}

function sortedPlayers(tournament){
  return [...tournament.players].sort(
    (a,b)=>
      compareKeys(
        rankingKey(tournament,a.id),
        rankingKey(tournament,b.id)
      )
  );
}

function unresolvedTieGroups(tournament){
  const groups=new Map();

  for(const player of tournament.players){
    const key=rankingKey(tournament,player.id).join(':');

    if(!groups.has(key)){
      groups.set(key,[]);
    }

    groups.get(key).push(player.id);
  }

  return [...groups.values()]
    .filter(ids=>ids.length>1);
}

function allMatchesComplete(
  tournament,
  type='all'
){
  return tournament.matches
    .filter(
      m=>
        type==='all'||
        m.type===type
    )
    .every(match=>!!match.winner);
}

function standingRows(
  tournament,
  final=false
){
  const ordered=
    final&&tournament.finalStandings?.length
      ?tournament.finalStandings
        .map(id=>playerById(tournament,id))
        .filter(Boolean)
      :sortedPlayers(tournament);

  return ordered.map((player,index)=>{
    const record=recordFor(tournament,player.id);

    const previous=
      index&&
      compareKeys(
        rankingKey(
          tournament,
          ordered[index-1].id
        ),
        rankingKey(
          tournament,
          player.id
        )
      )===0;

    const rank=
      previous
        ?'同率'
        :`${index+1}位`;

    return {
      player,
      record,
      rank
    };
  });
}

async function saveActive(){
  if(!cloud||!activeTournament){
    return;
  }

  activeTournament.updatedAt=
    new Date().toISOString();

  pendingSave=
    JSON.parse(
      JSON.stringify(activeTournament)
    );

  if(saving){
    return;
  }

  saving=true;

  try{
    while(pendingSave){
      const snapshot=pendingSave;

      pendingSave=null;

      await cloud.setActive(snapshot);
    }

    setCloudStatus(
      'ok',
      '同期済み',
      '大会データはクラウドへ自動保存されています。'
    );
  }catch(error){
    setCloudStatus(
      'warn',
      '保存エラー',
      `保存できませんでした：${error.message}`
    );
  }finally{
    saving=false;

    if(pendingSave){
      saveActive();
    }
  }
}

function scheduleSave(){
  saveActive();
}

function matchHtml(
  tournament,
  match
){
  const a=playerById(
    tournament,
    match.a
  );

  const b=playerById(
    tournament,
    match.b
  );

  return `
    <div class="match-card ${
      match.winner
        ?'played'
        :'unplayed'
    }">

      <div class="match-status">
        ${
          match.winner
            ?'入力済み'
            :'未対戦'
        }
      </div>

      <div class="match-buttons">

        <button
          type="button"
          data-match="${match.id}"
          data-winner="${a.id}"
          class="winner-btn ${
            match.winner===a.id
              ?'selected'
              :''
          }"
        >
          ${escapeHtml(a.name)} 勝利
        </button>

        <span>vs</span>

        <button
          type="button"
          data-match="${match.id}"
          data-winner="${b.id}"
          class="winner-btn ${
            match.winner===b.id
              ?'selected'
              :''
          }"
        >
          ${escapeHtml(b.name)} 勝利
        </button>

      </div>

      ${
        match.winner
          ?`
            <button
              type="button"
              class="clear-result"
              data-clear-match="${match.id}"
            >
              結果を取消
            </button>
          `
          :''
      }

    </div>
  `;
}

function renderActiveTournament(){
  const setup=
    $('#tournamentSetupPanel');

  const area=
    $('#activeTournamentArea');

  if(!activeTournament){
    setup.classList.remove('hidden');
    area.innerHTML='';
    return;
  }

  setup.classList.add('hidden');

  const tournament=
    activeTournament;

  const league=
    matchesOf(
      tournament,
      'league'
    );

  const sudden=
    matchesOf(
      tournament,
      'suddenDeath'
    );

  const ties=
    allMatchesComplete(tournament)
      ?unresolvedTieGroups(tournament)
      :[];

  area.innerHTML=`
    <section class="panel tournament-head-panel">

      <div class="section-title-row">

        <h2>開催中大会</h2>

        <span class="badge ok">
          リアルタイム同期
        </span>

      </div>

      <label class="block-label">
        大会名
        <input
          id="activeTournamentName"
          type="text"
          value="${escapeHtml(tournament.name)}"
        >
      </label>

      <div class="tournament-meta">
        開催日：
        ${escapeHtml(tournament.heldDate)}
        ／
        ${tournament.players.length}人
      </div>

      <div class="tournament-actions">

        <button
          id="finishTournamentBtn"
          class="primary-btn"
        >
          順位を確定して終了
        </button>

        <button
          id="deleteTournamentBtn"
          class="danger-btn"
        >
          大会を削除
        </button>

      </div>

    </section>

    <section class="panel">

      <h2>暫定順位</h2>

      <div class="standings-table">

        ${
          standingRows(tournament)
            .map(row=>`
              <div class="standing-row">

                <strong>
                  ${row.rank}
                </strong>

                <span>
                  ${escapeHtml(row.player.name)}
                </span>

                <span>
                  ${row.record.wins}勝
                  ${row.record.losses}敗
                </span>

              </div>
            `)
            .join('')
        }

      </div>

    </section>

    <section class="panel">

      <div class="section-title-row">

        <h2>通常リーグ</h2>

        <span class="badge ${
          allMatchesComplete(
            tournament,
            'league'
          )
            ?'ok'
            :'warn'
        }">
          ${
            league.filter(m=>m.winner).length
          }
          /
          ${league.length}
          試合
        </span>

      </div>

      ${
        league
          .map(
            m=>matchHtml(
              tournament,
              m
            )
          )
          .join('')
      }

    </section>

    <section class="panel">

      <div class="section-title-row">

        <h2>サドンデス</h2>

        <span class="badge soft">
          ${sudden.length}試合
        </span>

      </div>

      ${
        sudden.length
          ?sudden
            .map(
              m=>`
                <div class="sudden-label">
                  第${m.round}ラウンド
                </div>
                ${matchHtml(tournament,m)}
              `
            )
            .join('')
          :`
            <p class="note">
              通常リーグ終了後、
              同勝利数のグループに追加できます。
            </p>
          `
      }

      ${
        ties
          .map(
            ids=>`
              <button
                type="button"
                class="wide-btn add-sudden-btn"
                data-players="${ids.join(',')}"
              >
                ${
                  ids
                    .map(
                      id=>
                        escapeHtml(
                          playerById(
                            tournament,
                            id
                          ).name
                        )
                    )
                    .join('・')
                }
                のサドンデスを追加
              </button>
            `
          )
          .join('')
      }

    </section>
  `;

  area
    .querySelectorAll('[data-match]')
    .forEach(
      button=>
        button.onclick=()=>
          setWinner(
            button.dataset.match,
            button.dataset.winner
          )
    );

  area
    .querySelectorAll('[data-clear-match]')
    .forEach(
      button=>
        button.onclick=()=>
          setWinner(
            button.dataset.clearMatch,
            null
          )
    );

  area
    .querySelectorAll('.add-sudden-btn')
    .forEach(
      button=>
        button.onclick=()=>
          addSuddenDeath(
            button.dataset.players.split(',')
          )
    );

  $('#activeTournamentName').onchange=
    event=>{
      tournament.name=
        event.target.value.trim()||
        '名称未設定';

      scheduleSave();
    };

  $('#finishTournamentBtn').onclick=
    finishTournament;

  $('#deleteTournamentBtn').onclick=
    deleteActiveTournament;
}

function setWinner(
  matchId,
  winner
){
  const match=
    activeTournament.matches
      .find(
        item=>item.id===matchId
      );

  if(!match){
    return;
  }

  match.winner=winner;

  renderActiveTournament();

  scheduleSave();
}

function addSuddenDeath(ids){
  if(
    !allMatchesComplete(
      activeTournament
    )
  ){
    alert(
      '未入力の試合を完了してから次のサドンデスを追加してください。'
    );

    return;
  }

  const wins=
    leagueWins(
      activeTournament,
      ids[0]
    );

  const groupId=
    `wins-${wins}`;

  const round=
    Math.max(
      0,
      ...suddenRounds(
        activeTournament,
        groupId
      )
    )+1;

  for(
    let a=0;
    a<ids.length;
    a++
  ){
    for(
      let b=a+1;
      b<ids.length;
      b++
    ){
      activeTournament.matches.push({
        id:uid(),
        type:'suddenDeath',
        round,
        groupId,
        a:ids[a],
        b:ids[b],
        winner:null
      });
    }
  }

  renderActiveTournament();

  scheduleSave();
}

$('#startTournamentBtn').onclick=
async()=>{
  if(!cloud){
    alert(
      '先にFirebase設定を完了してください。'
    );

    return;
  }

  if(activeTournament){
    alert(
      '開催中の大会があります。終了または削除してから開始してください。'
    );

    return;
  }

  const source=
    sourceParticipants();

  if(source.length<2){
    alert(
      '大会には2人以上必要です。'
    );

    return;
  }

  const players=
    source.map(
      player=>({
        id:player.playerId,
        playerId:player.playerId,
        displayName:player.displayName,
        name:player.displayName,
        pokemon:JSON.parse(
          JSON.stringify(
            player.pokemon
          )
        )
      })
    );

  const tournament={
    schemaVersion:SCHEMA_VERSION,
    id:uid(),
    name:
      $('#newTournamentName')
        .value
        .trim()||
      `${today()} LovePoke大会`,
    heldDate:today(),
    status:'active',
    players,
    matches:[],
    finalStandings:[],
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString()
  };

  tournament.matches=
    createLeagueMatches(players);

  try{
    await cloud.createActive(
      tournament
    );
  }catch(error){
    alert(error.message);
  }
};

async function deleteActiveTournament(){
  if(
    !confirm(
      `開催中の「${activeTournament.name}」を削除しますか？\nこの操作は取り消せません。`
    )
  ){
    return;
  }

  try{
    await cloud.deleteActive(
      activeTournament.id
    );
  }catch(error){
    alert(error.message);
  }
}

async function finishTournament(){
  if(
    !allMatchesComplete(
      activeTournament
    )
  ){
    alert(
      '未入力の試合があります。'
    );

    return;
  }

  if(
    unresolvedTieGroups(
      activeTournament
    ).length
  ){
    alert(
      '同率の参加者がいます。必要なサドンデスを追加してください。'
    );

    return;
  }

  if(
    !confirm(
      `「${activeTournament.name}」の最終順位を確定し、大会を終了しますか？`
    )
  ){
    return;
  }

  const ended={
    ...activeTournament,
    status:'completed',
    finalStandings:
      sortedPlayers(
        activeTournament
      ).map(p=>p.id),
    completedAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString()
  };

  try{
    await cloud.complete(
      ended
    );
  }catch(error){
    alert(error.message);
  }
}

function completedRecord(
  tournament,
  playerId
){
  const includeSudden=
    $('#includeSuddenInStats')
      ?.checked!==false;

  return recordFor(
    tournament,
    playerId,
    tournament.matches.filter(
      match=>
        includeSudden||
        match.type==='league'
    )
  );
}

function percent(
  wins,
  total
){
  return total
    ?`${(
      wins/
      total*
      100
    ).toFixed(1)}%`
    :'—';
}

function renderHistory(){
  $('#historyCountBadge')
    .textContent=
      `${completedTournaments.length}大会`;

  const careers=
    new Map();

  for(
    const tournament
    of completedTournaments
  ){
    tournament.players.forEach(
      player=>{
        const key=
          player.playerId||
          player.id;

        if(
          !careers.has(key)
        ){
          careers.set(
            key,
            {
              id:key,
              name:
                player.displayName||
                player.name,
              events:0,
              first:0,
              second:0,
              third:0,
              wins:0,
              losses:0,
              ranks:[]
            }
          );
        }

        const stat=
          careers.get(key);

        const rank=
          tournament.finalStandings
            .indexOf(player.id)+1;

        const record=
          completedRecord(
            tournament,
            player.id
          );

        stat.events++;
        stat.wins+=record.wins;
        stat.losses+=record.losses;
        stat.ranks.push(rank);

        if(rank===1){
          stat.first++;
        }

        if(rank===2){
          stat.second++;
        }

        if(rank===3){
          stat.third++;
        }
      }
    );
  }

  const stats=
    [...careers.values()]
      .sort(
        (a,b)=>
          a.name.localeCompare(
            b.name,
            'ja'
          )
      );

  $('#careerStats').innerHTML=
    stats.length
      ?stats
        .map(
          s=>`
            <article class="career-card">

              <h3>
                ${escapeHtml(s.name)}
              </h3>

              <div>
                ${s.events}大会
                ／
                優勝${s.first}回
                ・
                2位${s.second}回
                ・
                3位${s.third}回
              </div>

              <div>
                ${s.wins}勝
                ${s.losses}敗
                ／
                勝率
                ${
                  percent(
                    s.wins,
                    s.wins+s.losses
                  )
                }
              </div>

              <div>
                平均順位
                ${
                  (
                    s.ranks.reduce(
                      (a,b)=>a+b,
                      0
                    )/
                    s.ranks.length
                  ).toFixed(2)
                }位
                ／
                最高
                ${Math.min(...s.ranks)}位
              </div>

            </article>
          `
        )
        .join('')
      :`
        <p class="note">
          終了済み大会はまだありません。
        </p>
      `;

  const select=
    $('#headToHeadPlayer');

  const selected=
    select.value;

  select.innerHTML=
    '<option value="">プレイヤーを選択</option>'+
    stats
      .map(
        s=>`
          <option value="${escapeHtml(s.id)}">
            ${escapeHtml(s.name)}
          </option>
        `
      )
      .join('');

  if(
    stats.some(
      s=>s.id===selected
    )
  ){
    select.value=
      selected;
  }

  renderHeadToHead();

  $('#pastTournamentList').innerHTML=
    completedTournaments.length
      ?completedTournaments
        .map(
          t=>`
            <button
              type="button"
              class="past-tournament-btn"
              data-past-id="${t.id}"
            >

              <strong>
                ${escapeHtml(t.name)}
              </strong>

              <span>
                ${escapeHtml(t.heldDate)}
                ・
                ${t.players.length}人
              </span>

            </button>
          `
        )
        .join('')
      :`
        <p class="note">
          過去大会はありません。
        </p>
      `;

  document
    .querySelectorAll('[data-past-id]')
    .forEach(
      button=>
        button.onclick=()=>
          renderPastDetail(
            button.dataset.pastId
          )
    );
}

$('#headToHeadPlayer').onchange=
  renderHeadToHead;

$('#includeSuddenInStats').onchange=
  renderHistory;

function renderHeadToHead(){
  const selected=
    $('#headToHeadPlayer')
      .value;

  const records=
    new Map();

  if(!selected){
    $('#headToHeadStats')
      .innerHTML=
        '<p class="note">プレイヤーを選択してください。</p>';

    return;
  }

  for(
    const tournament
    of completedTournaments
  ){
    const player=
      tournament.players
        .find(
          p=>
            (
              p.playerId||
              p.id
            )===selected
        );

    if(!player){
      continue;
    }

    for(
      const match
      of tournament.matches
    ){
      if(
        $('#includeSuddenInStats')
          ?.checked===false&&
        match.type==='suddenDeath'
      ){
        continue;
      }

      if(
        !match.winner||
        ![
          match.a,
          match.b
        ].includes(player.id)
      ){
        continue;
      }

      const opponent=
        playerById(
          tournament,
          match.a===player.id
            ?match.b
            :match.a
        );

      const opponentId=
        opponent.playerId||
        opponent.id;

      if(
        !records.has(
          opponentId
        )
      ){
        records.set(
          opponentId,
          {
            name:opponent.name,
            leagueW:0,
            leagueL:0,
            suddenW:0,
            suddenL:0
          }
        );
      }

      const stat=
        records.get(
          opponentId
        );

      const won=
        match.winner===
        player.id;

      const prefix=
        match.type==='league'
          ?'league'
          :'sudden';

      stat[
        `${prefix}${won?'W':'L'}`
      ]++;
    }
  }

  const selectedName=
    completedTournaments
      .flatMap(
        t=>t.players
      )
      .find(
        p=>
          (
            p.playerId||
            p.id
          )===selected
      )
      ?.name||
    selected;

  $('#headToHeadStats').innerHTML=
    [...records.values()]
      .map(
        s=>{
          const wins=
            s.leagueW+
            s.suddenW;

          const losses=
            s.leagueL+
            s.suddenL;

          return `
            <article class="career-card">

              <h3>
                ${escapeHtml(selectedName)}
                vs
                ${escapeHtml(s.name)}
              </h3>

              <div>
                通算
                ${wins+losses}戦
                ${wins}勝
                ${losses}敗
                ／
                勝率
                ${
                  percent(
                    wins,
                    wins+losses
                  )
                }
              </div>

              <div>
                通常リーグ
                ${s.leagueW}勝
                ${s.leagueL}敗
                ／
                サドンデス
                ${s.suddenW}勝
                ${s.suddenL}敗
              </div>

            </article>
          `;
        }
      )
      .join('')||
    '<p class="note">対戦記録はありません。</p>';
}

function renderPastDetail(id){
  const t=
    completedTournaments
      .find(
        item=>item.id===id
      );

  if(!t){
    return;
  }

  $('#pastTournamentDetail')
    .innerHTML=`
      <article class="past-detail">

        <label class="block-label">
          大会名
          <input
            id="pastTournamentName"
            type="text"
            value="${escapeHtml(t.name)}"
          >
        </label>

        <div>
          開催日：
          ${escapeHtml(t.heldDate)}
        </div>

        <h4>最終順位</h4>

        ${
          standingRows(
            t,
            true
          )
            .map(
              row=>{
                const savedRecord=
                  recordFor(
                    t,
                    row.player.id
                  );

                return `
                  <div>
                    ${row.rank}
                    ${escapeHtml(row.player.name)}
                    （
                    ${savedRecord.wins}勝
                    ${savedRecord.losses}敗
                    ）
                  </div>

                  <div class="past-pokemon">
                    ${
                      row.player.pokemon
                        .map(
                          p=>escapeHtml(
                            p.name
                          )
                        )
                        .join('・')||
                      'ポケモン未登録'
                    }
                  </div>
                `;
              }
            )
            .join('')
        }

        <h4>全対戦結果</h4>

        ${
          t.matches
            .map(
              m=>{
                const a=
                  playerById(
                    t,
                    m.a
                  );

                const b=
                  playerById(
                    t,
                    m.b
                  );

                const winner=
                  playerById(
                    t,
                    m.winner
                  );

                return `
                  <div class="past-match">

                    <span>
                      ${
                        m.type==='league'
                          ?'通常'
                          :'サドンデス'
                      }
                    </span>

                    ${escapeHtml(a.name)}
                    vs
                    ${escapeHtml(b.name)}
                    —
                    ${escapeHtml(winner.name)}
                    勝利

                  </div>
                `;
              }
            )
            .join('')
        }

        <button
          type="button"
          id="deletePastBtn"
          class="danger-btn"
        >
          この大会ログを削除
        </button>

      </article>
    `;

  $('#pastTournamentName').onchange=
    async event=>{
      t.name=
        event.target.value.trim()||
        '名称未設定';

      t.updatedAt=
        new Date().toISOString();

      await cloud.setCompleted(t);

      renderHistory();
    };

  $('#deletePastBtn').onclick=
    async()=>{
      if(
        confirm(
          `「${t.name}」の大会ログを削除しますか？`
        )
      ){
        await cloud.deleteCompleted(
          t.id
        );
      }
    };
}

async function initializeCloud(){
  const config=
    window.LOVEPOKE_FIREBASE_CONFIG;

  if(!config){
    setCloudStatus(
      'warn',
      '未設定',
      'firebase-config.jsへFirebase設定を入力すると大会機能を利用できます。'
    );

    $('#startTournamentBtn')
      .disabled=true;

    return;
  }

  let context;

  try{
    context=
      await getFirebaseContext();
  }catch(error){
    setCloudStatus(
      'warn',
      '読込エラー',
      `Firebase SDKを読み込めません：${error.message}`
    );

    return;
  }

  const {
    db,
    firestore:{
      doc,
      collection,
      onSnapshot,
      setDoc,
      deleteDoc,
      runTransaction
    }
  }=context;

  try{
    const activeRef=
      doc(
        db,
        ...ACTIVE_PATH
      );

    const historyRef=
      collection(
        db,
        'tournaments'
      );

    cloud={
      createActive:
        async tournament=>{
          await runTransaction(
            db,
            async transaction=>{
              if(
                (
                  await transaction.get(
                    activeRef
                  )
                ).exists()
              ){
                throw new Error(
                  '開催中の大会があります。'
                );
              }

              transaction.set(
                activeRef,
                tournament
              );
            }
          );
        },

      setActive:
        tournament=>
          runTransaction(
            db,
            async transaction=>{
              const current=
                await transaction.get(
                  activeRef
                );

              if(
                !current.exists()||
                current.data().id!==
                  tournament.id
              ){
                throw new Error(
                  '開催中の大会が変更されています。'
                );
              }

              transaction.set(
                activeRef,
                tournament
              );
            }
          ),

      deleteActive:
        expectedId=>
          runTransaction(
            db,
            async transaction=>{
              const current=
                await transaction.get(
                  activeRef
                );

              if(
                !current.exists()||
                current.data().id!==
                  expectedId
              ){
                throw new Error(
                  '開催中の大会が変更されています。'
                );
              }

              transaction.delete(
                activeRef
              );
            }
          ),

      complete:
        tournament=>
          runTransaction(
            db,
            async transaction=>{
              const current=
                await transaction.get(
                  activeRef
                );

              if(
                !current.exists()||
                current.data().id!==
                  tournament.id
              ){
                throw new Error(
                  '開催中の大会が変更されています。'
                );
              }

              transaction.set(
                doc(
                  historyRef,
                  tournament.id
                ),
                tournament
              );

              transaction.delete(
                activeRef
              );
            }
          ),

      setCompleted:
        tournament=>
          setDoc(
            doc(
              historyRef,
              tournament.id
            ),
            tournament
          ),

      deleteCompleted:
        id=>
          deleteDoc(
            doc(
              historyRef,
              id
            )
          )
    };

    onSnapshot(
      activeRef,
      snapshot=>{
        const incoming=
          snapshot.exists()
            ?normalizeTournament(
              snapshot.data()
            )
            :null;

        if(
          !incoming||
          !activeTournament||
          !pendingSave||
          (
            incoming.updatedAt||
            ''
          )>=
          (
            activeTournament.updatedAt||
            ''
          )
        ){
          activeTournament=
            incoming;
        }

        renderActiveTournament();

        setCloudStatus(
          'ok',
          '同期中',
          '他の端末で行われた変更も自動的に反映されます。'
        );
      },

      error=>
        setCloudStatus(
          'warn',
          '同期エラー',
          error.message
        )
    );

    onSnapshot(
      historyRef,

      snapshot=>{
        completedTournaments=
          snapshot.docs
            .map(
              item=>
                normalizeTournament(
                  item.data()
                )
            )
            .filter(Boolean)
            .sort(
              (a,b)=>
                (
                  b.completedAt||
                  ''
                )
                .localeCompare(
                  a.completedAt||
                  ''
                )
            );

        renderHistory();
      },

      error=>
        setCloudStatus(
          'warn',
          '履歴エラー',
          error.message
        )
    );

  }catch(error){
    setCloudStatus(
      'warn',
      '接続エラー',
      `Firebaseへ接続できません：${error.message}`
    );
  }
}

renderSourceParticipants();
renderActiveTournament();
renderHistory();
initializeCloud();