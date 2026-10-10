
const $=selector=>document.querySelector(selector);
const TYPE_JA={Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー'};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function pokemonById(idOrName){
  const data=window.POKEMON_DATA||[];
  const numeric=Number(idOrName);
  const candidates=Number.isFinite(numeric)&&String(idOrName).trim()!==''?
    data.filter(p=>Number(p.id)===numeric):
    data.filter(p=>p.name===String(idOrName));
  return candidates.find(p=>!p.formKey)||candidates[0]||null;
}
function moveName(id){return window.POKEMON_SV_MOVE_NAMES?.[id]||`技${id}`}
function typeNames(p){
  const key=p?.formKey?`${p.id}-${p.formKey}`:String(p?.id||'');
  return (window.POKEMON_TYPES?.[key]||window.POKEMON_TYPES?.[String(p?.id)]||[]).map(t=>TYPE_JA[t]||t);
}
function statText(p){
  const s=window.POKEMON_STATS?.[String(p?.id)]||null;
  return s?`BST ${s.bst??'—'} ／ S ${s.speed??'—'}`:'種族値データなし';
}
function renderDexStats(p){
  const key=p?.formKey?`${p.id}-${p.formKey}`:String(p?.id||'');
  const s=window.POKEMON_STATS?.[key]||window.POKEMON_STATS?.[String(p?.id)];
  if(!s)return '<p class="note">種族値データなし</p>';
  const fields=[['HP','hp'],['こうげき','attack'],['ぼうぎょ','defense'],['とくこう','spAttack'],['とくぼう','spDefense'],['すばやさ','speed']];
  return `<section class="guide-dex-stats" aria-label="種族値"><div class="guide-dex-stats-title"><strong>種族値</strong><strong>合計 ${escapeHtml(s.bst??'—')}</strong></div>
    ${fields.map(([label,key])=>`<div class="guide-dex-stat-row"><span>${label}</span><strong>${escapeHtml(s[key]??'—')}</strong><div class="guide-dex-stat-track"><div class="guide-dex-stat-fill ${key==='speed'?'is-speed':''}" style="width:${Math.min(100,Math.max(0,Number(s[key])||0)/180*100)}%"></div></div></div>`).join('')}</section>`;
}
function levelLabel(level){
  if(level===-3)return '進化時';
  if(level<=1)return 'Lv.1';
  return `Lv.${level}`;
}
const MOVE_TYPE_LABELS=['','ノーマル','かくとう','ひこう','どく','じめん','いわ','むし','ゴースト','はがね','ほのお','みず','くさ','でんき','エスパー','こおり','ドラゴン','あく','フェアリー'];
const MOVE_CLASS_LABELS={1:'変化',2:'物理',3:'特殊'};
const MOVE_EFFECT_JA={
 "7":"パンチで攻撃し、相手をやけど状態にすることがある。",
 "8":"パンチで攻撃し、相手をこおり状態にすることがある。",
 "9":"パンチで攻撃し、相手をまひ状態にすることがある。",
 "18":"相手を強制的に交代させる。野生ポケモンとの戦闘では終了する場合がある。",
 "38":"反動ダメージを受ける高威力の攻撃。",
 "46":"相手を強制的に交代させる。",
 "56":"大量の水で攻撃する。追加効果はない。",
 "59":"吹雪で攻撃し、相手をこおり状態にすることがある。",
 "68":"相手から受けた物理技のダメージを2倍にして返す。",
 "69":"自分のレベルと同じ固定ダメージを与える。",
 "73":"相手に種を植え、毎ターン最大HPの1/8を奪って回復する。",
 "83":"数ターン相手を炎の渦に閉じ込め、継続ダメージを与える。",
 "86":"相手をまひ状態にする。",
 "87":"雷で攻撃し、相手をまひ状態にすることがある。雨では必中になる。",
 "101":"自分のレベルと同じ固定ダメージを与える。",
 "113":"味方が受ける特殊技のダメージを数ターン軽減する。",
 "114":"すべてのポケモンの能力ランク変化を元に戻す。",
 "115":"味方が受ける物理技のダメージを数ターン軽減する。",
 "126":"強い炎で攻撃し、相手をやけど状態にすることがある。",
 "133":"自分の特防を2段階上げる。",
 "144":"相手の姿・能力・技をコピーして変身する。",
 "162":"相手の現在HPを半分にする。",
 "164":"最大HPの1/4を消費してみがわりを作り、攻撃や一部の変化技を代わりに受ける。",
 "166":"相手が最後に使った技を自分の技として覚える。",
 "187":"最大HPの半分を消費し、攻撃を最大まで上げる。",
 "188":"ヘドロを投げて攻撃し、相手をどく状態にすることがある。",
 "191":"交代して出てきた相手にダメージを与えるまきびしを設置する。重ねて使える。",
 "195":"3ターン後、場にいるポケモンがひんしになる。交代すると効果は解除される。",
 "196":"冷たい風で攻撃し、相手の素早さを1段階下げる。",
 "202":"与えたダメージの半分だけ自分のHPを回復する。",
 "226":"自分の能力ランク変化などを引き継いで交代する。",
 "227":"相手が最後に使った技を数ターン繰り返させる。",
 "229":"攻撃して自分の素早さを1段階上げ、設置技などを除去する。",
 "234":"自分のHPを回復する。天候によって回復量が変化する。",
 "235":"自分のHPを回復する。天候によって回復量が変化する。",
 "236":"自分のHPを回復する。天候によって回復量が変化する。",
 "243":"相手から受けた特殊技のダメージを2倍にして返す。",
 "245":"優先度+2で相手を攻撃する。",
 "247":"影を投げて攻撃し、相手の特防を下げることがある。",
 "250":"数ターン相手を渦に閉じ込め、継続ダメージを与える。",
 "252":"場に出た最初のターンだけ使える先制攻撃。相手をひるませる。",
 "261":"相手をやけど状態にする。",
 "262":"自分がひんしになる代わりに、相手の攻撃と特攻を2段階下げる。",
 "269":"相手が変化技を使えなくなる。",
 "271":"相手と持ち物を交換する。",
 "281":"次のターン終了時に相手をねむり状態にする。",
 "282":"相手の持ち物をはたき落とす。相手が持ち物を持っていると威力が上がる。",
 "283":"相手の残りHPが自分のHPと同じになるようにダメージを与える。",
 "284":"自分のHPが高いほど威力が高い。",
 "303":"自分の最大HPの半分を回復する。",
 "317":"岩を投げて攻撃し、相手の素早さを1段階下げる。",
 "322":"自分の防御と特防を1段階ずつ上げる。",
 "323":"自分のHPが高いほど威力が高い。",
 "331":"2～5回連続で攻撃する。",
 "334":"自分の防御を2段階上げる。",
 "339":"自分の攻撃と防御を1段階ずつ上げる。",
 "347":"自分の特攻と特防を1段階ずつ上げる。",
 "349":"自分の攻撃と素早さを1段階ずつ上げる。",
 "355":"自分のHPを最大HPの半分回復する。使用したターンはひこうタイプが一時的に失われる。",
 "360":"相手より素早さが低いほど威力が高くなる。",
 "362":"相手の残りHPが半分以下なら威力が2倍になる。",
 "366":"味方の素早さを数ターン2倍にする。",
 "369":"攻撃した後、手持ちのポケモンと交代する。",
 "370":"攻撃後、自分の防御と特防が1段階ずつ下がる。",
 "389":"相手が攻撃技を選んでいないと失敗する先制攻撃。",
 "390":"相手が交代で出てきたときにどく状態にするどくびしを設置する。",
 "394":"反動ダメージを受ける攻撃。相手をやけど状態にすることがある。",
 "399":"悪の波動で攻撃し、相手をひるませることがある。",
 "403":"空気の刃で攻撃し、相手をひるませることがある。",
 "409":"与えたダメージの半分だけ自分のHPを回復する。",
 "412":"エネルギーで攻撃し、相手の特防を下げることがある。",
 "413":"反動ダメージを受ける高威力の攻撃。",
 "417":"自分の特攻を2段階上げる。",
 "430":"鋼の光で攻撃し、相手の特防を下げることがある。",
 "433":"5ターンの間、素早さが低いポケモンから行動しやすくなる。",
 "434":"攻撃後、自分の特攻が2段階下がる。",
 "442":"攻撃し、相手をひるませることがある。",
 "444":"急所に当たりやすい岩技。",
 "446":"相手が交代して出てきたとき、岩タイプ相性に応じたダメージを与える。",
 "447":"相手が重いほど威力が高くなる。",
 "453":"優先度+1で攻撃する。",
 "473":"相手の防御を使ってダメージを計算する特殊技。",
 "483":"自分の特攻・特防・素早さを1段階ずつ上げる。",
 "484":"自分が相手より重いほど威力が高くなる。",
 "492":"相手の攻撃の値を使ってダメージを計算する。",
 "499":"相手の能力ランク変化を元に戻して攻撃する。",
 "500":"自分の能力ランク上昇が大きいほど威力が上がる。",
 "503":"熱い湯で攻撃し、相手をやけど状態にすることがある。",
 "512":"持ち物を持っていないと威力が2倍になる。",
 "521":"攻撃した後、手持ちのポケモンと交代する。",
 "528":"反動ダメージを受ける電気技。",
 "533":"相手の能力ランク変化を無視して攻撃する。",
 "535":"自分が相手より重いほど威力が高くなる。",
 "542":"風で攻撃し、相手をこんらん状態にすることがある。雨では必中になる。",
 "564":"相手が交代して出てきたとき、素早さを1段階下げるねばねばネットを設置する。",
 "583":"じゃれついて攻撃し、相手の攻撃を下げることがある。",
 "585":"月の力で攻撃し、相手の特攻を下げることがある。",

 147:'相手をねむり状態にする。くさタイプ、ぼうじん、そうしょくなどには無効になる場合がある。',
 89:'地面を揺らして攻撃する。あなをほる中の相手にも当たる。',
 85:'電撃で攻撃する。相手をまひ状態にすることがある。',
 53:'炎で攻撃する。相手をやけど状態にすることがある。',
 57:'大量の水を発射して攻撃する。',
 58:'冷気で攻撃する。相手をこおり状態にすることがある。',
 182:'そのターン、相手の攻撃から身を守る。連続で使うと失敗しやすくなる。',
 156:'HPと状態異常を回復して2ターンねむる。',
 14:'自分の攻撃を2段階上げる。',
 97:'自分の素早さを2段階上げる。',
 105:'自分のHPを最大HPの半分回復する。',
 92:'相手をもうどく状態にする。',
 164:'最大HPの1/4を消費してみがわりを作り、攻撃や一部の変化技を代わりに受ける。',
 33:'通常の物理攻撃。',
 94:'強い念力で攻撃する。相手の特防を下げることがある。'
};
function moveIdFromName(name){
 const names=window.POKEMON_SV_MOVE_NAMES||{};
 if(!window.__lovepokeMoveNameIds)window.__lovepokeMoveNameIds=Object.fromEntries(Object.entries(names).map(([id,label])=>[label,id]));
 return window.__lovepokeMoveNameIds[name];
}
function moveButton(name,sub=''){
 const id=moveIdFromName(name);
 const d=id&&window.LOVEPOKE_MOVE_DETAILS?.[id];
 if(!d)return `<div class="guide-move"><strong>${escapeHtml(name)}</strong>${sub?`<span>${escapeHtml(sub)}</span>`:''}</div>`;
 const type=MOVE_TYPE_LABELS[d.t]||'不明';
 const category=MOVE_CLASS_LABELS[d.c]||'不明';
 const desc=MOVE_EFFECT_JA[id]||'日本語の効果説明を準備中です。';
 const note='';
 const tags=[`タイプ：${type}`,`分類：${category}`,`威力：${d.p??'—'}`,`命中：${d.a??'—'}`,`PP：${d.pp??'—'}`];
 if(d.pr)tags.push(`優先度：${d.pr>0?'+':''}${d.pr}`);
 if(d.hits)tags.push(`連続攻撃：${d.hits.join('～')}回`);
 return `<details class="guide-move guide-move-expand"><summary><strong>${escapeHtml(name)}</strong>${sub?`<span>${escapeHtml(sub)}</span>`:''}<span class="guide-move-chevron">詳細</span></summary><div class="guide-move-info"><div class="guide-move-tags">${tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><p>${escapeHtml(desc)}</p>${note?`<small>${note}</small>`:''}</div></details>`;
}
function filterMoves(root,query){
  const q=query.trim();
  root.querySelectorAll('.guide-move').forEach(el=>{
    el.classList.toggle('hidden',!!q&&!el.textContent.includes(q));
  });
}
function inheritedEggMoves(p){
  const family=(window.POKEMON_DATA||[]).filter(x=>!x.formKey&&x.evo===p.evo);
  const ids=new Set();
  for(const member of family){
    const learn=window.POKEMON_SV_LEARNSETS?.[member.id]||{};
    (learn.e||[]).forEach(id=>ids.add(id));
  }
  return [...ids];
}
const DEX_ABILITY_JA={
 "しんりょく":"HPが最大HPの1/3以下になると、くさタイプの攻撃技の威力が1.5倍になる。",
 "もうか":"HPが最大HPの1/3以下になると、ほのおタイプの攻撃技の威力が1.5倍になる。",
 "げきりゅう":"HPが最大HPの1/3以下になると、みずタイプの攻撃技の威力が1.5倍になる。",
 "ようりょくそ":"晴れのとき、素早さが2倍になる。",
 "すいすい":"雨のとき、素早さが2倍になる。",
 "すなかき":"すなあらしのとき、素早さが2倍になり、すなあらしのダメージを受けない。",
 "ゆきかき":"雪のとき、素早さが2倍になる。",
 "あめふらし":"場に出たとき、天候を雨にする。",
 "ひでり":"場に出たとき、天候を晴れにする。",
 "すなおこし":"場に出たとき、天候をすなあらしにする。",
 "ゆきふらし":"場に出たとき、天候を雪にする。",
 "ちくでん":"でんきタイプの技を受けるとダメージを無効にし、最大HPの1/4を回復する。",
 "もらいび":"ほのおタイプの技を受けるとダメージを無効にし、自分のほのおタイプの技が強化される。",
 "ちょすい":"みずタイプの技を受けるとダメージを無効にし、最大HPの1/4を回復する。",
 "そうしょく":"くさタイプの技を受けると無効にし、自分の攻撃を1段階上げる。",
 "ひらいしん":"単体を対象とするでんきタイプの技を引き寄せて無効にし、特攻を1段階上げる。",
 "よびみず":"単体を対象とするみずタイプの技を引き寄せて無効にし、特攻を1段階上げる。",
 "ぼうじん":"天候によるダメージや粉・胞子の技を無効にする。",
 "マジックミラー":"自分に向けられた一部の変化技を相手に跳ね返す。",
 "マジックガード":"攻撃技による直接ダメージ以外ではHPが減らない。",
 "てつのこぶし":"パンチ技の威力が1.2倍になる。",
 "テクニシャン":"威力60以下の攻撃技の威力が1.5倍になる。",
 "すてみ":"反動ダメージを受ける技の威力が1.2倍になる。",
 "ふくがん":"自分の技の命中率が1.3倍になる。",
 "せいしんりょく":"ひるまなくなり、いかくによる攻撃低下も受けない。",
 "せいでんき":"接触技を受けると、相手をまひ状態にすることがある。",
 "ほのおのからだ":"接触技を受けると、相手をやけど状態にすることがある。",
 "どくのトゲ":"接触技を受けると、相手をどく状態にすることがある。",
 "のろわれボディ":"攻撃技を受けると、その技をかなしばり状態にすることがある。",
 "ムラっけ":"ターン終了時に能力が1つ大きく上がり、別の能力が1つ下がる。",
 "きょううん":"自分の技が急所に当たりやすくなる。",
 "スナイパー":"急所に当てたときのダメージ倍率が高くなる。",
 "いろめがね":"効果がいまひとつの攻撃技のダメージが2倍になる。",
 "あついしぼう":"ほのお・こおりタイプの攻撃技で受けるダメージを半減する。",
 "たいねつ":"ほのおタイプの技のダメージと、やけどによるダメージを半減する。",
 "フィルター":"効果抜群の技で受けるダメージを3/4にする。",
 "ハードロック":"効果抜群の技で受けるダメージを3/4にする。",
 "プリズムアーマー":"効果抜群の技で受けるダメージを3/4にする。",
 "ふしぎなうろこ":"状態異常のとき、防御が1.5倍になる。",
 "ポイズンヒール":"どく・もうどく状態のとき、ダメージを受けず、毎ターン最大HPの1/8を回復する。",
 "どくぼうそう":"どく・もうどく状態のとき、物理攻撃のダメージが1.5倍になる。",
 "はやあし":"状態異常のとき、素早さが1.5倍になる。",
 "かそく":"ターン終了時に素早さが1段階上がる。",
 "はりきり":"物理攻撃の威力に関わる攻撃が1.5倍になるが、物理技の命中率が0.8倍になる。",
 "ノーガード":"お互いの技が原則として必中になる。",
 "あまのじゃく":"自分の能力ランクの変化が逆になる。",
 "たんじゅん":"能力ランクの変化量が2倍になる。",
 "まけんき":"相手によって能力を下げられると、攻撃が2段階上がる。",
 "かちき":"相手によって能力を下げられると、特攻が2段階上がる。",
 "きんちょうかん":"相手は戦闘中にきのみを食べられなくなる。",
 "きれあじ":"切る技の威力が1.5倍になる。",
 "がんじょうあご":"噛みつく技の威力が1.5倍になる。",
 "パンクロック":"音の技の威力が1.3倍になり、受ける音の技のダメージを半減する。",
 "ぼうおん":"音を使う技を無効にする。",
 "ぼうだん":"弾・爆弾系の技を無効にする。",
 "ふみん":"ねむり状態にならない。",
 "やるき":"ねむり状態にならない。",
 "じゅうなん":"まひ状態にならない。",
 "めんえき":"どく・もうどく状態にならない。",
 "みずのベール":"やけど状態にならない。",
 "マイペース":"こんらん状態にならず、いかくの効果も受けない。",
 "どんかん":"メロメロ・ちょうはつ・いかくの効果を受けない。",
 "じょおうのいげん":"相手から受ける先制技を無効にする。",
 "ビビッドボディ":"相手から受ける先制技を無効にする。",
 "テイルアーマー":"相手から受ける先制技を無効にする。",
 "エレキメイカー":"場に出たとき、エレキフィールドを展開する。",
 "グラスメイカー":"場に出たとき、グラスフィールドを展開する。",
 "サイコメイカー":"場に出たとき、サイコフィールドを展開する。",
 "ミストメイカー":"場に出たとき、ミストフィールドを展開する。",
 "ふかしのこぶし":"接触技が相手のまもるなどを貫通する。",
 "わざわいのつるぎ":"自分以外のポケモンの防御を弱める。",
 "わざわいのたま":"自分以外のポケモンの特防を弱める。",
 "わざわいのうつわ":"自分以外のポケモンの特攻を弱める。",
 "わざわいのおふだ":"自分以外のポケモンの攻撃を弱める。",
 "おうごんのからだ":"相手から受ける変化技を無効にする。",
 "きよめのしお":"状態異常を防ぎ、ゴーストタイプの技で受けるダメージを半減する。",
 "どしょく":"じめんタイプの技を受けると無効にし、最大HPの1/4を回復する。",
 "こんがりボディ":"ほのおタイプの技を受けると無効にし、防御が2段階上がる。",
 "でんきにかえる":"攻撃技でダメージを受けると、じゅうでん状態になる。",
 "こぼれダネ":"攻撃技を受けるとグラスフィールドを展開する。",
 "そうだいしょう":"味方がひんしになるほど、場に出たときの攻撃技の威力が上がる。",
 "おもかげやどし":"テラスタルすると仮面に応じた能力が上がる。",
 "どくくぐつ":"自分の技で相手をどく・もうどくにすると、相手をこんらん状態にする。",

 'さめはだ':'接触技を受けると、攻撃した相手に相手の最大HPの1/8のダメージを与える。',
 'すながくれ':'すなあらしの間、相手の技の命中率が0.8倍になる。すなあらしのダメージも受けない。',
 'いかく':'場に出たとき、相手の攻撃ランクを1段階下げる。特性などで防がれる場合がある。',
 'ふゆう':'じめんタイプの攻撃技を受けない。ただし、かたやぶりなどの影響を受ける場合がある。',
 'マルチスケイル':'HPが満タンのとき、受けるダメージを半分にする。',
 'がんじょう':'HPが満タンなら一撃で倒されるダメージを受けてもHP1で耐える。一撃必殺技も無効。',
 'てんねん':'相手の攻撃・防御などの能力ランク変化を、自分が受ける技・与える技のダメージ計算で無視する。',
 'へんげんじざい':'技を出す直前に自分のタイプがその技のタイプに変わる。SVでは場に出るたび1回のみ。',
 'リベロ':'技を出す直前に自分のタイプがその技のタイプに変わる。SVでは場に出るたび1回のみ。',
 'かたやぶり':'相手の一部の特性を無視して技を使える。',
 'いたずらごころ':'変化技の優先度が1上がる。相手のあくタイプへの変化技は失敗する場合がある。',
 'じしんかじょう':'相手を倒すと攻撃ランクが1段階上がる。',
 'ちからもち':'物理攻撃のダメージ計算で攻撃が2倍になる。',
 'ヨガパワー':'物理攻撃のダメージ計算で攻撃が2倍になる。',
 'てきおうりょく':'タイプ一致技のダメージ補正が通常の1.5倍から2倍になる。',
 'こんじょう':'状態異常のとき、物理攻撃の威力に関わる攻撃が1.5倍になる。やけどによる物理ダメージ低下を受けない。',
 'ふしぎなまもり':'効果抜群の攻撃技以外による攻撃ダメージを受けない。状態異常や天候などのダメージは防げない。',
 'さいせいりょく':'手持ちに戻ると最大HPの1/3を回復する。',
 'プレッシャー':'相手が自分を対象とする技を使うと、PPを通常より1多く消費させる。',
 'クリアボディ':'相手の技や特性による能力ランク低下を防ぐ。',
 'きもったま':'ノーマル・かくとうタイプの技がゴーストタイプにも当たる。いかくの効果も受けない。',
 'おやこあい':'単体を対象とする攻撃技を2回攻撃する。2回目の威力は通常の25%。',
 'ばけのかわ':'最初に受ける攻撃技のダメージを無効化するが、最大HPの1/8のダメージを受けて姿が変わる。',
 'クォークチャージ':'ブーストエナジー所持時またはエレキフィールドで、最も高い能力が上昇する。',
 'こだいかっせい':'ブーストエナジー所持時または晴れのとき、最も高い能力が上昇する。'
};
function renderDexAbilities(p){
 const list=window.LOVEPOKE_DEX_EXTRA?.abilities?.[String(p.id)]||[];
 if(!list.length)return '<section class="guide-dex-abilities"><h3>特性</h3><p class="note">特性データなし</p></section>';
 return `<section class="guide-dex-abilities"><h3>特性</h3>${list.map(a=>`<details class="guide-dex-ability"><summary><strong>${escapeHtml(a.name)}</strong><span>${a.hidden?'隠れ特性':'通常特性'}</span></summary><p>${escapeHtml(DEX_ABILITY_JA[a.name]||'日本語の効果説明を準備中です。')}</p></details>`).join('')}</section>`;
}
function preEvolutionIds(p){
 const parents=window.LOVEPOKE_DEX_EXTRA?.parents||{};
 const ids=[],seen=new Set([Number(p.id)]);
 let id=Number(p.id);
 while(parents[String(id)]&&ids.length<8){
  const parent=Number(parents[String(id)]);
  if(seen.has(parent))break;
  seen.add(parent);ids.unshift(parent);id=parent;
 }
 return ids;
}
function renderPreEvolutionMoves(p){
 const ancestors=preEvolutionIds(p).filter(id=>window.POKEMON_SV_LEARNSETS?.[id]);
 if(!ancestors.length)return '';
 const current=window.POKEMON_SV_LEARNSETS?.[p.id]||{};
 const known=new Set([...(current.l||[]).map(x=>Number(x[0])),...(current.t||[]).filter(x=>String(x[1]??'').trim()!=='').map(x=>Number(x[0])),...(current.e||[]).map(Number)]);
 const moves=new Map();
 for(const id of ancestors){
  const previous=window.POKEMON_SV_LEARNSETS?.[id]||{};
  const name=pokemonById(id)?.name||'進化前';
  for(const [mid,level] of previous.l||[]){
   const n=Number(mid);if(known.has(n))continue;
   if(!moves.has(n))moves.set(n,[]);
   moves.get(n).push(`${name} ${levelLabel(level)}`);
  }
 }
 return `<div class="guide-pre-evo"><h3>進化前のみ覚える技（レベル習得） <span>${moves.size}件</span></h3><p class="hint">進化前のレベルアップで覚える技のうち、進化後のレベル習得・有効なわざマシン・タマゴ技にはない技です。思い出し技に掲載されていても、進化前での習得が必要な場合があります。</p><div class="guide-move-grid">${[...moves].map(([mid,source])=>moveButton(moveName(mid),[...new Set(source)].join(' / '))).join('')||'<p class="note">該当する技はありません。</p>'}</div></div>`;
}
function guideDexEntries(){
 return (window.POKEMON_DATA||[]).filter(p=>!p.formKey&&window.POKEMON_SV_LEARNSETS?.[p.id]).sort((a,b)=>a.id-b.id);
}
function renderDexNavigation(p){
 const entries=guideDexEntries();
 const index=entries.findIndex(x=>x.id===p.id);
 const previous=index>0?entries[index-1]:null;
 const next=index>=0&&index<entries.length-1?entries[index+1]:null;
 const btn=(target,label,arrow)=>target?`<button type="button" class="guide-neighbor-btn" data-guide-result="${target.id}"><span>${arrow} ${label}</span><strong>No.${String(target.id).padStart(4,'0')} ${escapeHtml(target.name)}</strong></button>`:`<span class="guide-neighbor-placeholder"></span>`;
 return `<nav class="guide-dex-navigation" aria-label="前後のポケモン">${btn(previous,'前のポケモン','←')}${btn(next,'次のポケモン','→')}</nav>`;
}
const DEX_ABILITY_DEFENSE={
 'ちょすい':{immune:['Water']},
 'よびみず':{immune:['Water']},
 'かんそうはだ':{immune:['Water'],factor:{Fire:1.25}},
 'もらいび':{immune:['Fire']},
 'こんがりボディ':{immune:['Fire']},
 'ちくでん':{immune:['Electric']},
 'ひらいしん':{immune:['Electric']},
 'でんきエンジン':{immune:['Electric']},
 'そうしょく':{immune:['Grass']},
 'ふゆう':{immune:['Ground']},
 'どしょく':{immune:['Ground']},
 'ぼうおん':{immune:['Sound']},
 'あついしぼう':{factor:{Fire:.5,Ice:.5}},
 'たいねつ':{factor:{Fire:.5}},
 'きよめのしお':{factor:{Ghost:.5}},
 'フィルター':{superEffective:.75},
 'ハードロック':{superEffective:.75},
 'プリズムアーマー':{superEffective:.75},
 'もふもふ':{factor:{Fire:2}},
 'ふしぎなまもり':{wonderGuard:true}
};
function dexDefenseRows(p,abilityName=''){
 const key=p?.formKey?`${p.id}-${p.formKey}`:String(p?.id||'');
 const defenders=window.POKEMON_TYPES?.[key]||window.POKEMON_TYPES?.[String(p?.id)]||[];
 if(!defenders.length)return '<p class="note">タイプデータなし</p>';
 const ability=DEX_ABILITY_DEFENSE[abilityName]||{};
 const rows=[];
 for(const attack of TYPE_ORDER){
  const base=defenders.reduce((n,defense)=>n*(TYPE_CHART[attack]?.[defense]??1),1);
  let multiplier=base,reason='';
  if(base>0&&ability.immune?.includes(attack)){
   multiplier=0;reason=abilityName;
  }else if(base>0&&ability.wonderGuard&&base<=1){
   multiplier=0;reason=abilityName;
  }else if(base>0){
   const factor=ability.factor?.[attack]??(ability.superEffective&&base>1?ability.superEffective:1);
   if(factor!==1){multiplier=base*factor;reason=abilityName}
  }
  rows.push({attack,multiplier,reason});
 }
 const groups=[[4,'×4 弱点'],[3,'×3 弱点'],[2,'×2 弱点'],[1.5,'×1.5 弱点'],[1,'×1 等倍'],[.75,'×0.75 軽減'],[.625,'×0.625 軽減'],[.5,'×0.5 半減'],[.375,'×0.375 軽減'],[.25,'×0.25 1/4'],[0,'×0 無効']];
 const known=new Set(groups.map(x=>x[0]));
 const extra=[...new Set(rows.filter(x=>!known.has(x.multiplier)).map(x=>x.multiplier))].sort((x,y)=>y-x).map(x=>[x,`×${x}`]);
 return [...groups,...extra].map(([value,label])=>{
  const items=rows.filter(x=>Math.abs(x.multiplier-value)<1e-9);
  if(!items.length||value===1&&!items.some(x=>x.reason))return '';
  return `<div class="guide-weakness-row"><strong>${label}</strong><div class="guide-weakness-types">${items.map(({attack,reason})=>`<span class="guide-weakness-entry"><span class="guide-type-chip">${escapeHtml(TYPE_JA[attack]||attack)}</span>${reason?`<small>（${escapeHtml(reason)}）</small>`:''}</span>`).join('')}</div></div>`;
 }).join('');
}
function renderDexWeaknesses(p){
 const abilities=window.LOVEPOKE_DEX_EXTRA?.abilities?.[String(p.id)]||[];
 const unique=[...new Set(abilities.map(x=>x.name))];
 const initial=unique[0]||'';
 return `<section class="guide-dex-weakness"><h3>タイプ相性（受けるダメージ）</h3><label class="guide-weakness-select-label" for="guideWeaknessAbility">反映する特性</label><select id="guideWeaknessAbility" class="guide-weakness-select"><option value="">特性なし（タイプのみ）</option>${unique.map(name=>`<option value="${escapeHtml(name)}" ${name===initial?'selected':''}>${escapeHtml(name)}${abilities.some(x=>x.name===name&&x.hidden)?'（隠れ特性）':''}</option>`).join('')}</select><div id="guideWeaknessRows">${dexDefenseRows(p,initial)}</div><p class="hint">選択した特性によるタイプ技の無効・倍率変化を反映。特性の発動条件、技固有の例外、持ち物・テラスタルは反映していません。対応外の特性はタイプ相性のみ表示します。</p></section>`;
}


// SV encounter guide: curated, verified entries only. Missing entries are not assumed unobtainable.
const SV_LOCATION_ENTRIES={
  906:{both:[['paldea','最初のパートナーとして選択','入手']]},
  909:{both:[['paldea','最初のパートナーとして選択','入手']]},
  912:{both:[['paldea','最初のパートナーとして選択','入手']]}
};
const SV_VERSION_LIMITED={"200":"violet","246":"scarlet","247":"scarlet","316":"violet","317":"violet","371":"violet","372":"violet","425":"scarlet","426":"scarlet","429":"violet","434":"scarlet","435":"scarlet","633":"scarlet","634":"scarlet","690":"scarlet","691":"scarlet","692":"violet","693":"violet","765":"scarlet","766":"violet","874":"scarlet","875":"violet","885":"violet","886":"violet","984":"scarlet","985":"scarlet","986":"scarlet","987":"scarlet","988":"scarlet","989":"scarlet","990":"violet","991":"violet","992":"violet","993":"violet","994":"violet","995":"violet","1005":"scarlet","1006":"violet","1007":"scarlet","1008":"violet"};
const SV_MAP_LINKS={
 paldea:'https://yakkun.com/sv/map.htm',
 kitakami:'https://yakkun.com/sv/map.htm?list=midori',
 blueberry:'https://www.pokeos.com/sv/map/blueberry-academy'
};
const SV_REGION_LABELS={paldea:'パルデア地方',kitakami:'キタカミの里',blueberry:'ブルーベリー学園'};
function svMemoKey(id,version){return 'lovepoke_sv_spot_'+id+'_'+version;}
function svMemoRead(id,version){
 try{return JSON.parse(localStorage.getItem(svMemoKey(id,version))||'[]').filter(x=>x&&typeof x.name==='string');}
 catch(_){return [];}
}
function svMemoSave(id,version,region,name){
 const list=svMemoRead(id,version);
 if(!name.trim()||list.length>=30)return false;
 list.push({region,name:name.trim().slice(0,80)});
 try{localStorage.setItem(svMemoKey(id,version),JSON.stringify(list));return true;}catch(_){return false;}
}
function bindSVSpotMemo(p,version){
 const region=document.querySelector('#guideSVSpotRegion');
 const name=document.querySelector('#guideSVSpotName');
 document.querySelector('#guideSVSpotAdd')?.addEventListener('click',()=>{
  if(!name?.value.trim())return;
  if(!svMemoSave(p.id,version,region.value,name.value)){alert('保存できませんでした。端末の空き容量などをご確認ください。');return;}
  const results=document.querySelector('#guideSVLocationResults');
  if(results){results.innerHTML=renderSVLocationResults(p,version);bindSVSpotMemo(p,version);}
 });
 document.querySelectorAll('[data-sv-spot-remove]').forEach(button=>button.addEventListener('click',()=>{
  const index=Number(button.dataset.svSpotRemove);
  const list=svMemoRead(p.id,version);
  if(!Number.isInteger(index)||index<0||index>=list.length)return;
  list.splice(index,1);
  try{localStorage.setItem(svMemoKey(p.id,version),JSON.stringify(list));}catch(_){return;}
  const results=document.querySelector('#guideSVLocationResults');
  if(results){results.innerHTML=renderSVLocationResults(p,version);bindSVSpotMemo(p,version);}
 }));
}
function renderSVLocations(p){
 const version=localStorage.getItem('lovepoke_sv_version')==='violet'?'violet':'scarlet';
 return `<section class="guide-sv-locations">
 <h3>SV 出現場所・入手方法</h3>
 <div class="guide-sv-version" role="group" aria-label="ゲームバージョン">
 <button type="button" data-sv-version="scarlet" class="${version==='scarlet'?'active':''}">スカーレット</button>
 <button type="button" data-sv-version="violet" class="${version==='violet'?'active':''}">バイオレット</button>
 </div>
 <div id="guideSVLocationResults">${renderSVLocationResults(p,version)}</div>
 </section>`;
}
function renderSVLocationResults(p,version){
 const record=SV_LOCATION_ENTRIES[p.id];
 const personal=svMemoRead(p.id,version);
 const locations=[...(record?.both||[]),...(record?.[version]||[])];
 const limit=SV_VERSION_LIMITED[p.id];
 const limitedMessage=limit?'<p class="guide-sv-limit">'+(limit===version?'このバージョンで入手できます。出現地点は確認中です。':'通常は'+(limit==='scarlet'?'スカーレット':'バイオレット')+'限定です。交換などで入手できる場合があります。')+'</p>':'';
 const searchQuery=encodeURIComponent(`ポケモンSV ${p.name} ${version==='scarlet'?'スカーレット':'バイオレット'} 出現場所 マップ`);
 const guideSearch='https://www.google.com/search?q='+searchQuery;
 const regions=[['paldea','パルデア地方','本編'],['kitakami','キタカミの里','碧の仮面'],['blueberry','ブルーベリー学園','藍の円盤']];
 const regionCards=regions.map(([id,label,subtitle])=>{
  const offlineMap='<div class="guide-sv-offline-map" role="img" aria-label="'+label+'の地域案内（模式図・出現地点未登録）"><div class="guide-sv-map-land"><span>'+label+'</span><small>出現地点データ未登録</small></div></div>';
  const matches=locations.filter(([region])=>region===id);
  return `<div class="guide-sv-region-card">
   <div class="guide-sv-region-card-top"><strong>${label}</strong><small>${subtitle}</small></div>
   ${offlineMap}<div class="guide-sv-region-status">${matches.length?`登録済み ${matches.length}件`:'出現情報を確認中'}</div>
   <a href="${SV_MAP_LINKS[id]}" target="_blank" rel="noopener noreferrer" class="guide-sv-map-link">エリアマップを見る ↗</a>
   </div>`;
 }).join('');
 return `${limitedMessage}<div class="guide-sv-region-grid">${regionCards}</div>
 <a class="guide-sv-lookup" href="${guideSearch}" target="_blank" rel="noopener noreferrer">「${escapeHtml(p.name)}」の${version==='scarlet'?'スカーレット':'バイオレット'}出現場所を調べる ↗</a>
 ${locations.length?`<ul class="guide-sv-location-list">${locations.map(([region,name,method])=>`<li><strong>${escapeHtml(name)}</strong><small>${SV_REGION_LABELS[region]} · ${escapeHtml(method)}</small></li>`).join('')}</ul>`:
 '<p class="note">このポケモンの出現場所はまだ登録・検証できていません。野生で出現しないという意味ではありません。</p>'}
 <div class="guide-sv-memo"><strong>自分の発見場所メモ（オフライン保存）</strong>
 <div class="guide-sv-memo-form"><select id="guideSVSpotRegion" aria-label="地域"><option value="paldea">パルデア</option><option value="kitakami">キタカミ</option><option value="blueberry">ブルーベリー</option></select><input id="guideSVSpotName" maxlength="80" placeholder="例：南2番エリア" aria-label="見つけた場所"><button type="button" id="guideSVSpotAdd">追加</button></div>
 ${personal.length?`<ul class="guide-sv-memo-list">${personal.map((entry,i)=>`<li><span>${escapeHtml(SV_REGION_LABELS[entry.region]||entry.region)}：${escapeHtml(entry.name)}</span><button type="button" data-sv-spot-remove="${i}" aria-label="メモを削除">削除</button></li>`).join('')}</ul>`:'<p class="note">自分で見つけた場所を記録できます。公式の出現データとは区別して表示します。</p>'}
 </div>
 <p class="hint">地域カードの図は位置を示さない模式図です。正確な地図はオンライン時に外部リンクから確認できます。出現地点のハイライトは、位置データの検証後に追加します。</p>`;
}

function renderPokemon(id){
  const p=pokemonById(id);
  const detail=$('#guidePokemonDetail');
  if(!p||!detail)return;
  const learn=window.POKEMON_SV_LEARNSETS?.[p.id]||{};
  const level=(learn.l||[]).map(([mid,lev])=>moveButton(moveName(mid),levelLabel(lev))).join('');
  const tm=(learn.t||[]).map(([mid,no])=>moveButton(moveName(mid),no?`TM${no}`:'')).join('');
  const eggMoves=inheritedEggMoves(p);
  const egg=eggMoves.map(mid=>moveButton(moveName(mid),'タマゴ技')).join('');
  const reminder=(learn.r||[]).map(mid=>moveButton(moveName(mid),'思い出し')).join('');
  const types=typeNames(p);
  detail.classList.remove('hidden');
  detail.innerHTML=`
    <button type="button" id="guideBackToList" class="ghost-btn guide-back-btn">← ポケモン一覧に戻る</button>
    ${renderDexNavigation(p)}
    <div class="guide-detail-head">
      <div>
        <div class="guide-dex-no">No.${String(p.id).padStart(4,'0')}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="guide-type-row">${types.map(t=>`<span class="guide-type-chip">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      
    </div>
    ${renderDexWeaknesses(p)}
    ${renderSVLocations(p)}
    ${renderDexStats(p)}
    ${renderDexAbilities(p)}
    <label class="block-label">このポケモンの技を絞り込み
      <input id="guideMoveFilter" type="search" placeholder="例：じしん">
    </label>
    ${renderPreEvolutionMoves(p)}
    <div class="guide-move-section"><h3>レベルで覚える技 <span>${(learn.l||[]).length}</span></h3><div class="guide-move-grid">${level||'<p class="note">データなし</p>'}</div></div>
    <div class="guide-move-section"><h3>わざマシン <span>${(learn.t||[]).length}</span></h3><div class="guide-move-grid">${tm||'<p class="note">データなし</p>'}</div></div>
    <div class="guide-move-section"><h3>タマゴ技 <span>${eggMoves.length}</span></h3><div class="guide-move-grid">${egg||'<p class="note">なし</p>'}</div></div>
    ${(learn.r||[]).length?`<div class="guide-move-section"><h3>思い出し技 <span>${learn.r.length}</span></h3><div class="guide-move-grid">${reminder}</div></div>`:''}
    <p class="hint">SV Ver.3.0.0（藍の円盤込み）の内蔵データを表示しています。特殊フォームは今後個別に補正できます。</p>
  `;
  $('#guideBackToList')?.addEventListener('click',()=>{
    detail.classList.add('hidden');
    const input=$('#guidePokemonSearch');
    if(input)input.value='';
    renderSuggestions('');
    $('#guideDexTool')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#guideWeaknessAbility')?.addEventListener('change',event=>{
    const rows=$('#guideWeaknessRows');
    if(rows)rows.innerHTML=dexDefenseRows(p,event.target.value);
  });
  detail.querySelectorAll('[data-sv-version]').forEach(button=>button.addEventListener('click',()=>{
    const version=button.dataset.svVersion;
    localStorage.setItem('lovepoke_sv_version',version);
    detail.querySelectorAll('[data-sv-version]').forEach(el=>el.classList.toggle('active',el.dataset.svVersion===version));
    const results=$('#guideSVLocationResults');
    if(results){results.innerHTML=renderSVLocationResults(p,version);bindSVSpotMemo(p,version);}
  }));
  bindSVSpotMemo(p,localStorage.getItem('lovepoke_sv_version')==='violet'?'violet':'scarlet');
  const filter=$('#guideMoveFilter');
  if(filter)filter.oninput=()=>filterMoves(detail,filter.value);
  detail.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSuggestions(query=''){
  const root=$('#guidePokemonSuggestions');
  if(!root)return;
  const q=query.trim();
  const data=(window.POKEMON_DATA||[]).filter(p=>!p.formKey&&window.POKEMON_SV_LEARNSETS?.[p.id]);
  const found=(q?data.filter(p=>p.name.includes(q)):data)
    .sort((a,b)=>(q?(b.name.startsWith(q)-a.name.startsWith(q)):0)||a.id-b.id);
  root.innerHTML=found.map(p=>`<button type="button" data-guide-result="${p.id}"><span>No.${String(p.id).padStart(4,'0')}</span><strong>${escapeHtml(p.name)}</strong></button>`).join('')||'<p class="note">該当するポケモンが見つかりません。</p>';
}
function activateGuide(){
  document.querySelectorAll('.poke-tab').forEach(x=>x.classList.toggle('active',x.dataset.pokePane==='guide'));
  document.querySelectorAll('.poke-pane').forEach(x=>x.classList.add('hidden'));
  $('#pokeGuidePane')?.classList.remove('hidden');
}
window.openLovePokeGuide=id=>{
  activateGuide();
  const p=pokemonById(id);
  if(p&&$('#guidePokemonSearch'))$('#guidePokemonSearch').value=p.name;
  renderSuggestions(p?.name||'');
  renderPokemon(id);
};
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-poke-guide-id],[data-guide-result]');
  if(!target)return;
  const id=target.dataset.pokeGuideId||target.dataset.guideResult;
  if(id)window.openLovePokeGuide(id);
});
const search=$('#guidePokemonSearch');
if(search){
  search.addEventListener('input',()=>renderSuggestions(search.value));
  search.addEventListener('focus',()=>renderSuggestions(search.value));
}
renderSuggestions('');


/* ===== Type chart / Speed comparison ===== */
const TYPE_SHORT={Normal:'無',Fire:'炎',Water:'水',Electric:'電',Grass:'草',Ice:'氷',Fighting:'闘',Poison:'毒',Ground:'地',Flying:'飛',Psychic:'超',Bug:'虫',Rock:'岩',Ghost:'霊',Dragon:'竜',Dark:'悪',Steel:'鋼',Fairy:'妖'};
const TYPE_ORDER=['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
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
 Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},Dragon:{Dragon:2,Steel:.5,Fairy:0},
 Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
 Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}
};
function renderTypeChart(){
  const root=$('#typeChartTable');if(!root)return;
  const cell=(a,d)=>{const v=TYPE_CHART[a]?.[d]??1;return v===2?'◎':v===.5?'△':v===0?'×':''};
  root.innerHTML=`<table class="type-chart"><thead><tr><th>攻＼防</th>${TYPE_ORDER.map(t=>`<th title="${TYPE_JA[t]}">${TYPE_SHORT[t]}</th>`).join('')}</tr></thead><tbody>${TYPE_ORDER.map(a=>`<tr><th title="${TYPE_JA[a]}">${TYPE_SHORT[a]}</th>${TYPE_ORDER.map(d=>{const mark=cell(a,d);return `<td class="type-effect-${mark==='◎'?'super':mark==='△'?'resist':mark==='×'?'immune':'normal'}">${mark}</td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function rankMultiplier(rank){
  const r=Math.max(-6,Math.min(6,Number(rank)||0));
  return r>=0?(2+r)/2:2/(2-r);
}
function speedStat(base,level=50,iv=31,ev=252,nature=1){
  const raw=Math.floor(((2*base+iv+Math.floor(ev/4))*level)/100)+5;
  return Math.floor(raw*nature);
}
const SPEED_ABILITY_BY_NAME={
  'フシギバナ':['ようりょくそ',2],'ラフレシア':['ようりょくそ',2],'ウツボット':['ようりょくそ',2],'ナッシー':['ようりょくそ',2],
  'キレイハナ':['ようりょくそ',2],'ワタッコ':['ようりょくそ',2],'ダーテング':['ようりょくそ',2],'トロピウス':['ようりょくそ',2],
  'リーフィア':['ようりょくそ',2],'エルフーン':['ようりょくそ',2],'ドレディア':['ようりょくそ',2],'マラカッチ':['ようりょくそ',2],
  'メブキジカ':['ようりょくそ',2],'アマージョ':['ようりょくそ',2],'スコヴィラン':['ようりょくそ',2],
  'キングドラ':['すいすい',2],'ハリーセン':['すいすい',2],'ルンパッパ':['すいすい',2],'フローゼル':['すいすい',2],
  'ネオラント':['すいすい',2],'ガマゲロゲ':['すいすい',2],'ツンベアー':['すいすい',2],'イダイトウ':['すいすい',2],'ハリーマン':['すいすい',2],
  'ドリュウズ':['すなかき',2],'ルガルガン':['すなかき',2],'ハカドッグ':['すなかき',2],'サンドパン':['すなかき',2],
  'ツンベアー':['ゆきかき',2],'ハルクジラ':['ゆきかき',2],'アローラサンドパン':['ゆきかき',2],
  'アローラライチュウ':['サーフテール',2],
  'サワムラー':['かるわざ',2],'フワライド':['かるわざ',2],'レパルダス':['かるわざ',2],'ルチャブル':['かるわざ',2],
  'ジュナイパー':['かるわざ',2],'オオニューラ':['かるわざ',2],
  'ハバタクカミ':['こだいかっせい',1.5],'トドロクツキ':['こだいかっせい',1.5],'テツノツツミ':['クォークチャージ',1.5],
  'テツノブジン':['クォークチャージ',1.5],'テツノドクガ':['クォークチャージ',1.5]
};
function benchmarkFor(p){
  const base=Number(window.POKEMON_STATS?.[String(p.id)]?.speed)||0;
  const fastest=speedStat(base,50,31,252,1.1);
  const neutral=speedStat(base,50,31,252,1);
  const ability=SPEED_ABILITY_BY_NAME[p.name]||null;
  return {p,base,fastest,neutral,scarf:Math.floor(fastest*1.5),ability,abilityValue:ability?Math.floor(fastest*ability[1]):null};
}
function tournamentPokemonIds(){
  const value=$('#speedTournamentFilter')?.value||'all';
  if(value==='all')return null;
  const tournament=(window.getLovePokeSpeedTournaments?.()||[]).find(t=>String(t.id)===value);
  if(!tournament)return new Set();
  const ids=[];
  for(const snapshot of (tournament.players||[]).flatMap(p=>p.pokemon||[])){
    const full=(window.POKEMON_DATA||[]).find(p=>Number(p.id)===Number(snapshot.id)&&String(p.formKey||'')===String(snapshot.formKey||''))||
      (window.POKEMON_DATA||[]).find(p=>Number(p.id)===Number(snapshot.id))||snapshot;
    const finals=window.getLovePokeFinalEvolutionList?.(full)||[];
    if(finals.length){
      const best=finals.reduce((a,b)=>(window.POKEMON_STATS?.[String(b.id)]?.bst||0)>(window.POKEMON_STATS?.[String(a.id)]?.bst||0)?b:a,finals[0]);
      ids.push(Number(best.id));
    }else ids.push(Number(snapshot.id));
  }
  return new Set(ids.filter(Number.isFinite));
}
function benchmarkRows(){
  const allowed=tournamentPokemonIds(),q=($('#speedSearch')?.value||'').trim(),seen=new Set();
  return (window.POKEMON_DATA||[]).filter(p=>{
    if(p.formKey||seen.has(Number(p.id)))return false;seen.add(Number(p.id));
    if(allowed&&!allowed.has(Number(p.id)))return false;
    if($('#speedSvOnly')?.checked&&!p.sv)return false;
    if(q&&!p.name.includes(q))return false;
    return !!window.POKEMON_STATS?.[String(p.id)];
  }).map(benchmarkFor).sort((a,b)=>b.fastest-a.fastest||b.base-a.base||a.p.id-b.p.id);
}
function targetPokemon(){
  const name=($('#speedTargetSearch')?.value||'').trim();
  return (window.POKEMON_DATA||[]).find(p=>!p.formKey&&p.name===name)||null;
}
function targetSpeed(){
  const p=targetPokemon();if(!p)return null;
  const base=Number(window.POKEMON_STATS?.[String(p.id)]?.speed)||0;
  const iv=Math.max(0,Math.min(31,Number($('#speedIv')?.value)||0));
  const ev=Math.max(0,Math.min(252,Number($('#speedEv')?.value)||0));
  const nature=Number($('#speedNature')?.value)||1;
  let value=speedStat(base,50,iv,ev,nature);
  value=Math.floor(value*(Number($('#speedItem')?.value)||1));
  const ability=$('#speedAbility')?.value||'1';
  value=Math.floor(value*(ability==='quickfeet'?1.5:(Number(ability)||1)));
  value=Math.floor(value*rankMultiplier($('#speedRank')?.value));
  if($('#speedTailwind')?.checked)value*=2;
  if($('#speedParalysis')?.checked&&ability!=='quickfeet')value=Math.floor(value*.5);
  return {p,base,value:Math.max(1,Math.floor(value))};
}
function renderSpeedTable(){
  const root=$('#speedTable');if(!root)return;
  const rows=benchmarkRows(),target=targetSpeed();
  $('#speedResultCount').textContent=`${rows.length}体`;
  const counts=rows.reduce((m,row)=>(m.set(row.fastest,(m.get(row.fastest)||0)+1),m),new Map());
  let last=null,rank=0;
  root.innerHTML=rows.map((row,index)=>{
    const groupCount=counts.get(row.fastest)||1;
    const groupStart=index===0||rows[index-1].fastest!==row.fastest;
    const groupEnd=index===rows.length-1||rows[index+1].fastest!==row.fastest;
    if(groupStart){rank=index+1;last=row.fastest}
    const targetSame=!!(target&&row.fastest===target.value);
    const near=!!(target&&!targetSame&&Math.abs(row.fastest-target.value)<=1);
    const classes=['speed-row','benchmark-row',groupCount>1?'speed-tie':'',groupStart&&groupCount>1?'speed-tie-start':'',groupEnd&&groupCount>1?'speed-tie-end':'',targetSame?'speed-tie-target':'',near?'target-line-near':''].filter(Boolean).join(' ');
    const tieBadge=groupStart&&groupCount>1?`<small class="speed-tie-badge">同速 ${row.fastest}・${groupCount}体</small>`:'';
    return `<button type="button" class="${classes}" data-poke-guide-id="${row.p.id}"><span class="speed-rank">${rank}</span><span class="speed-name"><strong>${escapeHtml(row.p.name)}</strong>${tieBadge}<small>No.${String(row.p.id).padStart(4,'0')}</small></span><span class="speed-base">S${row.base}</span><span>${row.fastest}</span><span>${row.neutral}</span><span>${row.scarf}</span><span class="speed-ability-value">${row.ability?`${row.abilityValue}<small>${row.ability[0]}</small>`:'—'}</span></button>`;
  }).join('')||'<p class="note">条件に該当するポケモンがいません。</p>';
  renderTargetResult(rows,target);
}
function renderTargetResult(rows,target){
  const root=$('#speedTargetResult');if(!root)return;
  if(!target){root.innerHTML='ポケモンを選ぶと、ここに実数値と位置を表示します。';return}
  const allLines=rows.flatMap(r=>[
    {value:r.fastest,label:`${r.p.name} 最速`},{value:r.neutral,label:`${r.p.name} 準速`},
    {value:r.scarf,label:`${r.p.name} 最速スカーフ`},...(r.ability?[{value:r.abilityValue,label:`${r.p.name} ${r.ability[0]}発動`}]:[])
  ]).sort((a,b)=>b.value-a.value);
  const faster=allLines.filter(x=>x.value>target.value).sort((a,b)=>a.value-b.value)[0];
  const slower=allLines.filter(x=>x.value<target.value).sort((a,b)=>b.value-a.value)[0];
  const equal=allLines.filter(x=>x.value===target.value).slice(0,3);
  root.innerHTML=`<div class="speed-target-main"><strong>${escapeHtml(target.p.name)}</strong><span>S${target.base}</span><b>実数値 ${target.value}</b></div>
    ${equal.length?`<div class="speed-line-equal">同速：${equal.map(x=>escapeHtml(x.label)).join(' / ')}</div>`:''}
    <div class="speed-line-around"><span>ひとつ上：${faster?`${escapeHtml(faster.label)} (${faster.value})`:'なし'}</span><span>ひとつ下：${slower?`${escapeHtml(slower.label)} (${slower.value})`:'なし'}</span></div>`;
}
function refreshTournamentFilter(){
  const select=$('#speedTournamentFilter');if(!select)return;
  const current=select.value,tournaments=window.getLovePokeSpeedTournaments?.()||[];
  select.innerHTML='<option value="all">全ポケモン</option>'+tournaments.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t._speedLabel||t.name||'大会')}</option>`).join('');
  if([...select.options].some(o=>o.value===current))select.value=current;
  const list=$('#speedPokemonList');
  if(list)list.innerHTML=(window.POKEMON_DATA||[]).filter(p=>!p.formKey&&p.sv).map(p=>`<option value="${escapeHtml(p.name)}"></option>`).join('');
  renderSpeedTable();
}
function showGuideTool(tool='dex'){
  document.querySelectorAll('.guide-tool-tab').forEach(b=>b.classList.toggle('active',b.dataset.guideTool===tool));
  document.querySelectorAll('.guide-tool-pane').forEach(p=>p.classList.add('hidden'));
  const id={dex:'guideDexTool',types:'guideTypesTool',speed:'guideSpeedTool',party:'guidePartyTool',build:'guideBuildTool'}[tool];
  if(id)document.getElementById(id)?.classList.remove('hidden');
  if(tool==='types')renderTypeChart();
  if(tool==='speed'){refreshTournamentFilter();renderSpeedTable()} if(tool==='party')refreshPartyAnalysisSelect(); if(tool==='build')renderBuildMemos()
}
document.querySelectorAll('.guide-tool-tab').forEach(b=>b.addEventListener('click',()=>showGuideTool(b.dataset.guideTool)));
['speedTournamentFilter','speedIv','speedEv','speedNature','speedItem','speedAbility','speedRank','speedTailwind','speedParalysis','speedSvOnly'].forEach(id=>{
  document.getElementById(id)?.addEventListener('change',renderSpeedTable);
});
$('#speedSearch')?.addEventListener('input',renderSpeedTable);
$('#speedTargetSearch')?.addEventListener('input',renderSpeedTable);
window.addEventListener('lovePokeTournamentsUpdated',refreshTournamentFilter);
renderTypeChart();
refreshTournamentFilter();


/* ===== Party analysis / build memo ===== */
const PARTY_TYPE_JA={Normal:'無',Fire:'炎',Water:'水',Electric:'電',Grass:'草',Ice:'氷',Fighting:'闘',Poison:'毒',Ground:'地',Flying:'飛',Psychic:'超',Bug:'虫',Rock:'岩',Ghost:'霊',Dragon:'竜',Dark:'悪',Steel:'鋼',Fairy:'妖'};
function analysisFinal(p){
  const full=(window.POKEMON_DATA||[]).find(x=>Number(x.id)===Number(p.id)&&String(x.formKey||'')===String(p.formKey||''))||(window.POKEMON_DATA||[]).find(x=>Number(x.id)===Number(p.id))||p;
  const finals=window.getLovePokeFinalEvolutionList?.(full)||[];
  if(!finals.length)return full;
  return finals.reduce((a,b)=>(window.POKEMON_STATS?.[String(b.id)]?.bst||0)>(window.POKEMON_STATS?.[String(a.id)]?.bst||0)?b:a,finals[0]);
}
function partyTypeRows(player){
  const mons=(player.pokemon||[]).map(analysisFinal).map(p=>({p,types:window.POKEMON_TYPES?.[String(p.id)]||[]}));
  return TYPE_ORDER.map(atk=>{
    const effects=mons.map(m=>TYPE_CHART[atk]?m.types.reduce((v,t)=>v*(TYPE_CHART[atk]?.[t]??1),1):1);
    return {type:atk,weak:effects.filter(v=>v>1).length,resist:effects.filter(v=>v>0&&v<1).length,immune:effects.filter(v=>v===0).length};
  });
}
function partyCoverage(player){
  const mons=(player.pokemon||[]).map(analysisFinal).map(p=>({p,types:window.POKEMON_TYPES?.[String(p.id)]||[]}));
  return TYPE_ORDER.map(def=>{
    const hitters=mons.filter(m=>m.types.some(atk=>(TYPE_CHART[atk]?.[def]??1)>1));
    return {def,hitters};
  });
}
function renderPartyAnalysis(){
  const root=$('#partyAnalysisResult'),sel=$('#partyAnalysisSelect');if(!root||!sel)return;
  const [tid,pid]=(sel.value||'').split('::'),t=(window.getLovePokeSpeedTournaments?.()||[]).find(x=>String(x.id)===tid),player=t?.players?.find(p=>String(p.playerId||p.id)===pid);
  if(!player){root.innerHTML='<p class="note">大会とプレイヤーを選ぶと6体をまとめて分析します。</p>';return}
  const typeRows=partyTypeRows(player),coverage=partyCoverage(player),mons=(player.pokemon||[]).map(analysisFinal);
  root.innerHTML=`<div class="party-analysis-title"><strong>${escapeHtml(player.displayName||player.name||'PLAYER')}</strong><span>${mons.map(x=>escapeHtml(x.name)).join('・')}</span></div>
    <h3>弱点・耐性</h3><div class="party-type-grid">${typeRows.map(x=>`<div class="${x.weak>=3?'party-danger':''}"><b>${PARTY_TYPE_JA[x.type]}</b><span>弱 ${x.weak}</span><span>耐 ${x.resist}</span><span>無 ${x.immune}</span></div>`).join('')}</div>
    <h3>攻撃範囲（タイプ一致）</h3><div class="coverage-grid">${coverage.map(x=>`<div class="${x.hitters.length?'covered':'uncovered'}"><b>${PARTY_TYPE_JA[x.def]}</b><span>${x.hitters.length?`抜群 ${x.hitters.length}体`:'抜群なし'}</span><small>${x.hitters.map(h=>escapeHtml(h.p.name)).join('・')}</small></div>`).join('')}</div>`;
}
function refreshPartyAnalysisSelect(){
  const sel=$('#partyAnalysisSelect');if(!sel)return;const current=sel.value,ts=window.getLovePokeSpeedTournaments?.()||[];
  sel.innerHTML='<option value="">大会・プレイヤーを選択</option>'+ts.flatMap(t=>(t.players||[]).map(p=>`<option value="${escapeHtml(t.id)}::${escapeHtml(p.playerId||p.id)}">${escapeHtml(t._speedLabel||t.name)} / ${escapeHtml(p.displayName||p.name)}</option>`)).join('');
  if([...sel.options].some(o=>o.value===current))sel.value=current;renderPartyAnalysis();
}
$('#partyAnalysisSelect')?.addEventListener('change',renderPartyAnalysis);
window.addEventListener('lovePokeTournamentsUpdated',refreshPartyAnalysisSelect);
/* ===== Photo stat -> EV estimator ===== */
const PHOTO_KEYS=['hp','attack','defense','spAttack','spDefense','speed'];
const PHOTO_IDS={hp:'statPhotoHp',attack:'statPhotoAtk',defense:'statPhotoDef',spAttack:'statPhotoSpa',spDefense:'statPhotoSpd',speed:'statPhotoSpe'};
const PHOTO_SHORT={hp:'H',attack:'A',defense:'B',spAttack:'C',spDefense:'D',speed:'S'};
function photoNature(k){const u=$('#statPhotoNatureUp')?.value,d=$('#statPhotoNatureDown')?.value;return u===k?1.1:(d===k?0.9:1)}
function photoStat(base,k,lv,iv,ev){const q=Math.floor(((2*base+iv+Math.floor(ev/4))*lv)/100);return k==='hp'?q+lv+10:Math.floor((q+5)*photoNature(k))}
function photoEvOpts(base,k,lv,val,iv){const a=[];for(let ev=0;ev<=252;ev+=4)if(photoStat(base,k,lv,iv,ev)===val)a.push(ev);return a}
function photoIv0Opts(base,k,lv,val){const a=[];for(let iv=0;iv<=31;iv++)if(photoStat(base,k,lv,iv,0)===val)a.push(iv);return a}
function photoSpeedOpts(base,lv,val,maxEv){const a=[];for(let iv=0;iv<=31;iv++)for(let ev=0;ev<=Math.min(252,maxEv);ev+=4)if(photoStat(base,'speed',lv,iv,ev)===val)a.push({iv,ev});return a}
function photoPoke(){const n=$('#statPhotoPokemon')?.value.trim();return (window.POKEMON_DATA||[]).find(p=>p.name===n)}
const PHOTO_NATURE_NAMES={
 'attack|defense':'さみしがり','attack|spAttack':'いじっぱり','attack|spDefense':'やんちゃ','attack|speed':'ゆうかん',
 'defense|attack':'ずぶとい','defense|spAttack':'わんぱく','defense|spDefense':'のうてんき','defense|speed':'のんき',
 'spAttack|attack':'ひかえめ','spAttack|defense':'おっとり','spAttack|spDefense':'うっかりや','spAttack|speed':'れいせい',
 'spDefense|attack':'おだやか','spDefense|defense':'おとなしい','spDefense|spAttack':'しんちょう','spDefense|speed':'なまいき',
 'speed|attack':'おくびょう','speed|defense':'せっかち','speed|spAttack':'ようき','speed|spDefense':'むじゃき'
};
function photoNatureName(){
 const up=$('#statPhotoNatureUp')?.value||'',down=$('#statPhotoNatureDown')?.value||'';
 return up&&down&&up!==down?(PHOTO_NATURE_NAMES[up+'|'+down]||''):'';
}
function calculatePhotoEv(){
 const p=photoPoke(),root=$('#statPhotoResult');if(!root)return;if(!p){root.innerHTML='<p class="photo-warn">ポケモン名を確認してください。</p>';return}
 const st=window.POKEMON_STATS?.[String(p.id)],lv=Math.max(1,Math.min(100,Number($('#statPhotoLevel')?.value)||50));if(!st)return;
 const v={};for(const k of PHOTO_KEYS)v[k]=Number($('#'+PHOTO_IDS[k])?.value);if(Object.values(v).some(x=>!Number.isFinite(x)||x<=0)){root.innerHTML='<p class="photo-warn">6つの能力値を確認してください。</p>';return}
 const z={};let used=0,bad=false;
 for(const k of ['hp','attack','defense','spAttack','spDefense']){const e=photoEvOpts(st[k],k,lv,v[k],31);if(e.length){z[k]={ev:e[0],iv:'31',kind:e[0]?'trained':'max0'};used+=e[0]}else{const iv=photoIv0Opts(st[k],k,lv,v[k]);if(iv.length)z[k]={ev:0,iv:iv.length===1?String(iv[0]):iv[0]+'〜'+iv[iv.length-1],kind:'unused'};else{z[k]={ev:0,iv:'要確認',kind:'bad'};bad=true}}}
 const s31=photoEvOpts(st.speed,'speed',lv,v.speed,31),remain=Math.max(0,508-used);
 if(s31.length&&s31[0]<=remain)z.speed={ev:s31[0],iv:'31',kind:s31[0]?'trained':'max0'};else{const so=photoSpeedOpts(st.speed,lv,v.speed,remain);if(so.length){so.sort((a,b)=>(b.iv-a.iv)||(a.ev-b.ev));z.speed={ev:so[0].ev,iv:String(so[0].iv),kind:'speed',opts:so.slice(0,8)}}else{z.speed={ev:0,iv:'要確認',kind:'bad'};bad=true}}
 const total=Object.values(z).reduce((n,x)=>n+(x.ev||0),0);
 let msg=bad?'能力値または性格補正に、現在の条件では成立しない箇所があります。':total===508?'EV508で矛盾なく成立します。':total<508?'努力値の振り忘れ、または育成対象能力の個体値を最大まで上げ忘れている可能性があります。':'EVが508を超えるため、読み取り値・性格・個体値を確認してください。';
 const rows=PHOTO_KEYS.map(k=>'<tr><th>'+PHOTO_SHORT[k]+'</th><td>'+v[k]+'</td><td>'+z[k].ev+'</td><td>'+z[k].iv+'</td><td>'+(z[k].kind==='unused'?'EV0としてIV推定':z[k].kind==='speed'?'S調整候補':z[k].kind==='bad'?'要確認':'IV31前提')+'</td></tr>').join('');
 const sx=z.speed.opts?.length?'<p class="hint">S候補：'+z.speed.opts.map(x=>'IV'+x.iv+'/EV'+x.ev).join('、')+'</p>':'';
 root.innerHTML='<div class="photo-ev-summary '+((bad||total!==508)?'warn':'')+'"><strong>推定EV '+total+'/508</strong><p>'+escapeHtml(msg)+'</p></div><div class="photo-result-scroll"><table><thead><tr><th></th><th>実数値</th><th>EV</th><th>IV</th><th>判定</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+sx+'<button id="applyPhotoEvToMemo" type="button" class="ghost-btn">育成メモへ反映</button>';
 $('#applyPhotoEvToMemo')?.addEventListener('click',()=>{$('#buildMemoPokemon').value=p.name;const natureName=photoNatureName();if(natureName)$('#buildMemoNature').value=natureName;$('#buildMemoEv').value=PHOTO_KEYS.filter(k=>z[k].ev>0).map(k=>PHOTO_SHORT[k]+z[k].ev).join(' ');const det=PHOTO_KEYS.filter(k=>z[k].kind==='unused'||z[k].kind==='speed').map(k=>PHOTO_SHORT[k]+': IV'+z[k].iv+' / EV'+z[k].ev).join('、');$('#buildMemoNote').value=[det,msg].filter(Boolean).join('\n')});
}
async function ocrGuidedNumber(src,rect,isHp=false){
 const sw=src.width||src.videoWidth,sh=src.height||src.videoHeight,[x,y,w,h]=rect,base=document.createElement('canvas');
 base.width=Math.max(120,Math.round(sw*w*8));base.height=Math.max(60,Math.round(sh*h*8));
 const bg=base.getContext('2d');bg.imageSmoothingEnabled=false;bg.drawImage(src,sw*x,sh*y,sw*w,sh*h,0,0,base.width,base.height);
 const variants=[base];
 for(const threshold of [125,155,185]){
  const c=document.createElement('canvas');c.width=base.width;c.height=base.height;const g=c.getContext('2d');g.drawImage(base,0,0);
  const d=g.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const v=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2],q=v>threshold?255:0;d.data[i]=d.data[i+1]=d.data[i+2]=q}g.putImageData(d,0,0);variants.push(c);
 }
 const found=[];
 for(const canvas of variants){
  const rec=await window.Tesseract.recognize(canvas,'eng',{tessedit_char_whitelist:isHp?'0123456789/':'0123456789',tessedit_pageseg_mode:'7'});
  const nums=String(rec.data?.text||'').match(/\d{2,3}/g)||[];for(const n of nums){const v=Number(n);if(v>=10&&v<=999)found.push(v)}
 }
 if(!found.length)return null;
 const freq=new Map();for(const v of found)freq.set(v,(freq.get(v)||0)+1);
 return [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
async function ocrGuidedMaxHp(src,rect){
 const sw=src.width||src.videoWidth,sh=src.height||src.videoHeight,[x,y,w,h]=rect;
 // The SV HP line is "current / max". Crop only the right-hand max-value zone.
 const crops=[
  // Keep all three digits of the max-HP value; previous crops started too far right.
  [x+w*.46,y+h*.36,w*.50,h*.60],
  [x+w*.43,y+h*.40,w*.54,h*.56],
  [x+w*.49,y+h*.44,w*.47,h*.50]
 ],found=[];
 for(const cr of crops){
  const xs=await ocrGuidedNumber(src,cr,false);
  if(xs?.length)found.push(...xs);
 }
 if(!found.length)return null;
 const freq=new Map();for(const v of found)freq.set(v,(freq.get(v)||0)+1);
 return [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
function currentGuidedStatRects(){
 const guide=$('#statCameraOverlay .stat-camera-guide'),gr=guide?.getBoundingClientRect();
 if(!guide||!gr?.width||!gr?.height)return null;
 const sels={hp:'.ghp',spAttack:'.gspa',attack:'.gatk',spDefense:'.gspd',defense:'.gdef',speed:'.gspe'};
 return Object.fromEntries(Object.entries(sels).map(([k,sel])=>{const r=guide.querySelector(sel).getBoundingClientRect();return[k,[(r.left-gr.left)/gr.width,(r.top-gr.top)/gr.height,r.width/gr.width,r.height/gr.height]]}));
}
function numericRect(k,r){
 if(k==='hp')return[r[0]+r[2]*.12,r[1]+r[3]*.48,r[2]*.76,r[3]*.45];
 // The lower B/D guide boxes are taller so their values sit safely inside the frame.
 // Crop their lower-middle band explicitly; other four stats keep the proven crop.
 if(k==='defense'||k==='spDefense')return[r[0]+r[2]*.14,r[1]+r[3]*.46,r[2]*.72,r[3]*.42];
 return[r[0]+r[2]*.16,r[1]+r[3]*.50,r[2]*.68,r[3]*.42];
}
function possiblePhotoStatValues(base,k,lv){
 const vals=new Set(),natures=k==='hp'?[1]:[.9,1,1.1];
 for(const nature of natures)for(let iv=0;iv<=31;iv++)for(let ev=0;ev<=252;ev+=4){
  const q=Math.floor(((2*base+iv+Math.floor(ev/4))*lv)/100);
  vals.add(k==='hp'?q+lv+10:Math.floor((q+5)*nature));
 }
 return vals;
}
async function readGuidedStats(src,rects){
 const out={},p=photoPoke(),st=p&&window.POKEMON_STATS?.[String(p.id)],lv=Math.max(1,Math.min(100,Number($('#statPhotoLevel')?.value)||50));
 for(const [k,r] of Object.entries(rects||{})){
  const rois=[];
  if(k==='hp'){
   const possible=st?possiblePhotoStatValues(st[k],k,lv):null;
   const xs=await ocrGuidedMaxHp(src,r);
   const valid=(xs||[]).filter(v=>!possible||possible.has(v));
   if(valid.length)out[k]=valid[0];
   continue;
  }else{
   // Tight number crops are authoritative; wider crops only rescue difficult captures.
   if(k==='defense'||k==='spDefense'){
    // B/D are the weakest SV camera positions. Sample the number at several
    // nearby vertical offsets so small framing differences do not produce blanks.
    const ys=[.24,.32,.40,.48];
    for(const [i,yy] of ys.entries()){
     rois.push({r:[r[0]+r[2]*.10,r[1]+r[3]*yy,r[2]*.80,r[3]*.34],w:6-i});
     rois.push({r:[r[0]+r[2]*.18,r[1]+r[3]*(yy+.03),r[2]*.64,r[3]*.28],w:4-i*.5});
    }
    rois.push({r:[r[0]+r[2]*.04,r[1]+r[3]*.18,r[2]*.92,r[3]*.62],w:1});
   }else{
    rois.push({r:numericRect(k,r),w:6});
    rois.push({r:[r[0]+r[2]*.13,r[1]+r[3]*.46,r[2]*.74,r[3]*.46],w:3});
    rois.push({r:[r[0]+r[2]*.20,r[1]+r[3]*.53,r[2]*.62,r[3]*.36],w:2});
    rois.push({r:[r[0]+r[2]*.08,r[1]+r[3]*.40,r[2]*.84,r[3]*.52],w:1});
   }
  }
  const possible=st?possiblePhotoStatValues(st[k],k,lv):null,score=new Map();
  for(const item of rois){
   let xs=await ocrGuidedNumber(src,item.r,k==='hp');
   if(!xs?.length)continue;
   xs.forEach((v,rank)=>{if(!possible||possible.has(v))score.set(v,(score.get(v)||0)+item.w/Math.max(1,rank+1))});
  }
  const ranked=[...score.entries()].sort((a,b)=>b[1]-a[1]);
  if(ranked.length)out[k]=ranked[0][0];
 }
 return out;
}
function detectNatureMarkers(src,rects){
 const sw=src.width||src.videoWidth,sh=src.height||src.videoHeight;
 const keys=['attack','defense','spAttack','spDefense','speed'],scores=[];
 // Nature arrows sit on the hexagon side of each stat block, not outside it.
 // Sample a compact vertical strip around that inner edge.
 const markerRoi={
  attack:r=>[r[0]-r[2]*.18,r[1]+r[3]*.08,r[2]*.32,r[3]*.58],
  defense:r=>[r[0]-r[2]*.18,r[1]+r[3]*.08,r[2]*.32,r[3]*.58],
  spAttack:r=>[r[0]+r[2]*.86,r[1]+r[3]*.08,r[2]*.32,r[3]*.58],
  spDefense:r=>[r[0]+r[2]*.86,r[1]+r[3]*.08,r[2]*.32,r[3]*.58],
  speed:r=>[r[0]+r[2]*.32,r[1]-r[3]*.14,r[2]*.36,r[3]*.36]
 };
 for(const k of keys){
  const r=rects?.[k];if(!r)continue;
  const [rx,ry,rw,rh]=markerRoi[k](r),cc=document.createElement('canvas');
  cc.width=Math.max(28,Math.round(sw*rw));cc.height=Math.max(28,Math.round(sh*rh));
  const g=cc.getContext('2d');g.drawImage(src,sw*rx,sh*ry,sw*rw,sh*rh,0,0,cc.width,cc.height);
  const d=g.getImageData(0,0,cc.width,cc.height).data;let red=0,blue=0;
  for(let i=0;i<d.length;i+=4){
   const R=d[i],G=d[i+1],B=d[i+2],mx=Math.max(R,G,B),mn=Math.min(R,G,B);
   if(R>=135&&R-G>=35&&R-B>=12&&mx-mn>=40)red++;
   if(B>=125&&B-R>=28&&B-G>=5&&mx-mn>=32)blue++;
  }
  scores.push({k,red,blue});
 }
 const rr=[...scores].sort((a,b)=>b.red-a.red),up=rr[0]&&rr[0].red>=2?rr[0]:null;
 if(!up)return{up:'',down:'',scores};
 const br=scores.filter(x=>x.k!==up.k).sort((a,b)=>b.blue-a.blue),b1=br[0],b2=br[1];
 return{up:up.k,down:b1&&b1.blue>=2&&b1.blue>=(b2?.blue||0)+1?b1.k:'',scores};
}
async function consumeGuidedImage(src,previewUrl,rects){
 const pv=$('#statPhotoPreview'),box=$('#statPhotoConfirm');pv.classList.remove('hidden');pv.innerHTML='<img src="'+previewUrl+'" alt="能力六角形"><p id="statPhotoOcrStatus" class="hint">6つの能力値を読み取っています…</p>';box.classList.remove('hidden');
 for(const k of PHOTO_KEYS)$('#'+PHOTO_IDS[k]).value='';
 try{const vals=await readGuidedStats(src,rects),nature=detectNatureMarkers(src,rects);for(const k of PHOTO_KEYS)if(vals[k])$('#'+PHOTO_IDS[k]).value=vals[k];$('#statPhotoNatureUp').value=nature.up||'';$('#statPhotoNatureDown').value=nature.down||'';const n=PHOTO_KEYS.filter(k=>vals[k]).length;const short={attack:'A',defense:'B',spAttack:'C',spDefense:'D',speed:'S'};const dbg=(nature.scores||[]).map(x=>short[x.k]+' 赤:'+x.red+' 青:'+x.blue).join(' / ');$('#statPhotoOcrStatus').textContent='能力値 '+n+'/6 を取得しました。'+(nature.up||nature.down?' 性格補正も反映しました。':' 性格補正は確認してください。')+(dbg?'［性格検出 '+dbg+' → ↑'+(short[nature.up]||'なし')+' ↓'+(short[nature.down]||'なし')+'］':'')}catch{$('#statPhotoOcrStatus').textContent='読み取りに失敗しました。空欄を入力してください。'}
}
function renderStatPokemonChoices(){
 const input=$('#statPhotoPokemon'),box=$('#statPhotoPokemonChoices');if(!input||!box)return;
 const q=input.value.trim();if(!q){box.classList.add('hidden');box.innerHTML='';return}
 const rows=(window.POKEMON_DATA||[]).filter(p=>p.sv!==false&&p.name.includes(q)).slice(0,12);
 box.innerHTML=rows.map(p=>'<button type="button" class="stat-pokemon-choice" data-name="'+p.name+'">'+p.name+'</button>').join('');
 box.classList.toggle('hidden',!rows.length);
}
$('#statPhotoPokemon')?.addEventListener('input',renderStatPokemonChoices);
$('#statPhotoPokemon')?.addEventListener('focus',renderStatPokemonChoices);
$('#statPhotoPokemonChoices')?.addEventListener('click',e=>{const b=e.target.closest('.stat-pokemon-choice');if(!b)return;e.preventDefault();e.stopPropagation();$('#statPhotoPokemon').value=b.dataset.name;$('#statPhotoPokemon').blur();requestAnimationFrame(()=>$('#statPhotoPokemonChoices')?.classList.add('hidden'))});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.stat-pokemon-picker'))$('#statPhotoPokemonChoices')?.classList.add('hidden')});
let statCameraStream=null;
async function openStatCamera(){
 document.activeElement?.blur();
 await new Promise(r=>setTimeout(r,80));
 const poke=$('#statPhotoPokemon')?.value.trim(),lv=Number($('#statPhotoLevel')?.value);if(!poke||!lv||lv<1||lv>100){alert('先にポケモンとLvを入力してください。');return}
 try{statCameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});const v=$('#statCameraVideo');v.srcObject=statCameraStream;await v.play();$('#statCameraOverlay').classList.remove('hidden')}catch{alert('カメラを開けませんでした。カメラ権限を確認してください。')}
}
function closeStatCamera(){statCameraStream?.getTracks().forEach(t=>t.stop());statCameraStream=null;$('#statCameraOverlay')?.classList.add('hidden')}
$('#statPhotoCameraBtn')?.addEventListener('click',openStatCamera);
$('#statCameraCancel')?.addEventListener('click',closeStatCamera);
$('#statCameraShutter')?.addEventListener('click',async()=>{
 const v=$('#statCameraVideo'),guide=$('#statCameraOverlay .stat-camera-guide'),vr=v.getBoundingClientRect(),gr=guide.getBoundingClientRect();
 const vw=v.videoWidth,vh=v.videoHeight,scale=Math.min(vr.width/vw,vr.height/vh),drawW=vw*scale,drawH=vh*scale,offX=vr.left+(vr.width-drawW)/2,offY=vr.top+(vr.height-drawH)/2;
 const sx=Math.max(0,(gr.left-offX)/scale),sy=Math.max(0,(gr.top-offY)/scale),sw=Math.min(vw-sx,gr.width/scale),sh=Math.min(vh-sy,gr.height/scale);
 const canvas=document.createElement('canvas');canvas.width=Math.round(sw);canvas.height=Math.round(sh);canvas.getContext('2d').drawImage(v,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
 const rects=currentGuidedStatRects();closeStatCamera();await consumeGuidedImage(canvas,canvas.toDataURL('image/jpeg',.94),rects);
});
$('#statPhotoCalculate')?.addEventListener('click',calculatePhotoEv);

const BUILD_MEMO_KEY='lovePokeBuildMemosV1';
function loadBuildMemos(){try{return JSON.parse(localStorage.getItem(BUILD_MEMO_KEY)||'[]')}catch{return []}}
function renderBuildMemos(){
 const root=$('#buildMemoList');if(!root)return;const rows=loadBuildMemos();
 root.innerHTML=rows.length?rows.map((m,i)=>`<article class="build-memo-card"><div><strong>${escapeHtml(m.pokemon)}</strong><span>${escapeHtml(m.nature||'—')} / ${escapeHtml(m.ev||'—')} / ${escapeHtml(m.item||'—')}</span></div><p>${escapeHtml(m.note||'')}</p><button type="button" data-build-delete="${i}" class="ghost-btn">削除</button></article>`).join(''):'<p class="note">保存した育成メモはまだありません。</p>';
}
$('#saveBuildMemo')?.addEventListener('click',()=>{
 const pokemon=$('#buildMemoPokemon')?.value.trim();if(!pokemon)return;
 const rows=loadBuildMemos();rows.unshift({pokemon,nature:$('#buildMemoNature')?.value.trim()||'',ev:$('#buildMemoEv')?.value.trim()||'',item:$('#buildMemoItem')?.value.trim()||'',note:$('#buildMemoNote')?.value.trim()||'',savedAt:new Date().toISOString()});
 localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(rows.slice(0,100)));renderBuildMemos();
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-build-delete]');if(!b)return;const rows=loadBuildMemos();rows.splice(Number(b.dataset.buildDelete),1);localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(rows));renderBuildMemos()});

const BUILD_BACKUP_LAST_KEY='lovePokeBuildBackupLastAtV1';
function formatBackupTime(iso){if(!iso)return '未作成';const d=new Date(iso);return Number.isNaN(d.getTime())?'未作成':d.toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function setBuildBackupStatus(message){const el=$('#buildBackupStatus');if(el)el.textContent=message}
function showBuildBackupLast(){setBuildBackupStatus(`最終バックアップ：${formatBackupTime(localStorage.getItem(BUILD_BACKUP_LAST_KEY))}　※大会データには共有されません。`)}
$('#exportBuildMemos')?.addEventListener('click',()=>{
 const payload={app:'love-poke-tools',kind:'build-memos',version:1,exportedAt:new Date().toISOString(),memos:loadBuildMemos()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 const d=new Date(),stamp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}`;
 a.href=url;a.download=`ラブカポケモン_育成メモバックアップ_${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 localStorage.setItem(BUILD_BACKUP_LAST_KEY,d.toISOString());showBuildBackupLast();
});
$('#importBuildMemos')?.addEventListener('click',()=>$('#importBuildMemosFile')?.click());
$('#importBuildMemosFile')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(data?.app!=='love-poke-tools'||data?.kind!=='build-memos'||!Array.isArray(data.memos))throw new Error('育成メモのバックアップではありません');
  const clean=data.memos.slice(0,100).filter(m=>m&&typeof m.pokemon==='string').map(m=>({pokemon:m.pokemon,nature:String(m.nature||''),ev:String(m.ev||''),item:String(m.item||''),note:String(m.note||''),savedAt:String(m.savedAt||'')}));
  if(!confirm(`現在の育成メモをバックアップの${clean.length}件で置き換えます。よろしいですか？`))return;
  localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(clean));renderBuildMemos();setBuildBackupStatus(`バックアップから${clean.length}件を復元しました。`);
 }catch(err){setBuildBackupStatus(`復元できませんでした：${err.message}`)}
 finally{e.target.value=''}
});
refreshPartyAnalysisSelect();renderBuildMemos();showBuildBackupLast();
