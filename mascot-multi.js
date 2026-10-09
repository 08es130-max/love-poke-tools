(() => {
'use strict';
const ROOT='lovePokeMascotRoot',KEY='lovepoke_mascot_settings_v3',OLD='lovepoke_mascot_settings_v2',VER='0.9.79';
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
// Each member keeps her own pace and preferred rhythm.
const PERSONALITY=Object.freeze({
  ayumu:   {pace:.86,rest:12200,restMs:1700,turn:12000},
  kasumi:  {pace:1.43,rest:16600,restMs:880,turn:4100},
  shizuku: {pace:.82,rest:15000,restMs:1500,turn:11500},
  karin:   {pace:.69,rest:10500,restMs:1900,turn:16000},
  ai:      {pace:1.52,rest:16300,restMs:830,turn:3600},
  kanata:  {pace:.57,rest:6100,restMs:3900,turn:17000},
  setsuna: {pace:1.56,rest:17500,restMs:770,turn:3100},
  emma:    {pace:.78,rest:10800,restMs:1800,turn:14200},
  rina:    {pace:1.26,rest:11200,restMs:900,turn:3500},
  shioriko:{pace:.88,rest:12800,restMs:1400,turn:10400},
  mia:     {pace:1.04,rest:16300,restMs:1250,turn:9800},
  lanzhu:  {pace:1.36,rest:14300,restMs:1050,turn:5800},
  yu:      {pace:1.14,rest:12300,restMs:1200,turn:8100}
});
// Prefer these pairs for approaching each other and occasionally walking together.
const BONDS=[
  ['ayumu','yu'],['kasumi','shizuku'],['ai','rina'],
  ['kanata','emma'],['karin','emma'],['shioriko','lanzhu'],
  ['setsuna','yu'],['mia','lanzhu'],['setsuna','shioriko'],
  ['ai','karin'],['ayumu','shizuku'],['mia','rina']
];
// Original short exchanges; order matches the two names in each entry.
const PAIR_DIALOGUES=[
  {ids:['ayumu','yu'],lines:[
    ['侑ちゃん、一緒に少し歩かない？','うん！ 歩夢ちゃんとならどこまでも！'],
    ['侑ちゃん、今日も楽しそうだね','歩夢ちゃんの笑顔も、ときめくよ！']]},
  {ids:['kasumi','shizuku'],lines:[
    ['しず子〜！ かすみんを褒めてください！','ふふ、今日もかわいいですよ、かすみさん'],
    ['しず子、かすみんと勝負です！','もう、かすみさんってば……']]},
  {ids:['ai','rina'],lines:[
    ['りなりー！ 一緒に探検しよっ！','うん。愛さんとなら楽しい'],
    ['今日もりなりーは最高だね！','璃奈ちゃんボード「にっこり」']]},
  {ids:['kanata','emma'],lines:[
    ['エマちゃん、一緒にお昼寝しよ〜','いいよ。のんびり休もうね'],
    ['ふあぁ……おやつの夢を見たよ〜','ふふっ、今度一緒に食べようね']]},
  {ids:['karin','emma'],lines:[
    ['エマ、今日はどこへ行く？','果林ちゃんと一緒ならどこでも楽しいよ'],
    ['ちょっと休んでもいいかしら','もちろん！ 無理しないでね']]},
  {ids:['shioriko','lanzhu'],lines:[
    ['嵐珠、少し落ち着いてください','栞子ももっと楽しみなさい！'],
    ['一緒にがんばりましょう','ええ、ランジュに任せなさい！']]},
  {ids:['setsuna','yu'],lines:[
    ['侑さん！ 今日も全力です！','その熱い気持ち、ときめくよ！'],
    ['大好きを叫びたいです！','私も！ 一緒に応援しよう！']]},
  {ids:['mia','lanzhu'],lines:[
    ['ランジュ、少し声が大きいよ','ミアだって楽しんでるじゃない！']]},
  {ids:['setsuna','shioriko'],lines:[
    ['栞子さん、全力で楽しみましょう！','はい。ですが無理は禁物ですよ']]},
  {ids:['ai','karin'],lines:[
    ['カリン！ 今日もキマってるね！','ふふ、愛こそ元気いっぱいね']]},
  {ids:['ayumu','shizuku'],lines:[
    ['しずくちゃん、練習お疲れさま！','ありがとうございます、歩夢さん！']]},
  {ids:['mia','rina'],lines:[
    ['リナ、面白い曲を思いついたんだ','聴きたい。ボード「わくわく」']]}
];

// All remaining combinations have their own character-to-character exchanges.
const MORE_PAIR_DIALOGUES=[
 {
  "ids": [
   "ayumu",
   "kasumi"
  ],
  "lines": [
   [
    "かすみちゃん、今日は元気だね",
    "歩夢先輩！ かすみんのかわいさも絶好調です！"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "karin"
  ],
  "lines": [
   [
    "果林さんの歩き方、すてきです",
    "ふふ、歩夢も背筋を伸ばしてみて"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "ai"
  ],
  "lines": [
   [
    "愛ちゃん、今日は何して遊ぶ？",
    "歩夢と一緒なら何でも楽しそう！"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "kanata"
  ],
  "lines": [
   [
    "彼方さん、眠そうだけど大丈夫？",
    "歩夢ちゃん、ちょっとだけ休ませて〜"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "setsuna"
  ],
  "lines": [
   [
    "せつ菜ちゃん、練習頑張ってるね",
    "歩夢さんの頑張りも見ていますよ！"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "emma"
  ],
  "lines": [
   [
    "エマさん、お菓子を作ったんです",
    "わあ、歩夢ちゃんの手作り？ 食べたいな！"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "rina"
  ],
  "lines": [
   [
    "璃奈ちゃん、一緒にお散歩しよう？",
    "うん。歩夢さんとなら安心"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "shioriko"
  ],
  "lines": [
   [
    "栞子ちゃん、お疲れさま",
    "ありがとうございます。歩夢さんも休憩してください"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "mia"
  ],
  "lines": [
   [
    "ミアちゃん、音楽を聴いてたの？",
    "うん。ちょうどいいメロディーが浮かんだ"
   ]
  ]
 },
 {
  "ids": [
   "ayumu",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠ちゃん、今日は何がしたい？",
    "歩夢！ 一緒に最高の一日にするわよ！"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "karin"
  ],
  "lines": [
   [
    "果林先輩！ かすみんも大人っぽくなれますか？",
    "ふふ、まずは落ち着いてみたら？"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "ai"
  ],
  "lines": [
   [
    "愛先輩！ かすみんの魅力、広めてください！",
    "任せて！ かわいいかすみんを応援だ！"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "kanata"
  ],
  "lines": [
   [
    "彼方先輩、寝てないでかすみんを見てください！",
    "見てるよ〜。かわいいね〜"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "setsuna"
  ],
  "lines": [
   [
    "せつ菜先輩、かすみんのステージも見てください！",
    "もちろんです！ 全力で応援します！"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "emma"
  ],
  "lines": [
   [
    "エマ先輩、かすみんの新しい髪型どうです？",
    "とってもかわいいよ、かすみちゃん"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "rina"
  ],
  "lines": [
   [
    "りな子〜！ かわいいかすみんボード作って！",
    "璃奈ちゃんボード「かすみん、ぴかぴか」"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "shioriko"
  ],
  "lines": [
   [
    "栞子後輩！ かすみん先輩についてきて！",
    "はい。ですが廊下は走らないでくださいね"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "mia"
  ],
  "lines": [
   [
    "ミア子！ かすみんの曲も作ってください！",
    "その呼び方やめたら考えてあげる"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠先輩！ かすみんだって負けませんよ！",
    "いいわ！ ランジュを驚かせてみなさい！"
   ]
  ]
 },
 {
  "ids": [
   "kasumi",
   "yu"
  ],
  "lines": [
   [
    "侑先輩！ かすみんが一番ですよね？",
    "みんな大好き！ でもかすみんもすごくかわいい！"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "karin"
  ],
  "lines": [
   [
    "果林さん、表現力のコツを教えてください",
    "自分の魅力を信じて演じてみて"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "ai"
  ],
  "lines": [
   [
    "愛さん、次の演目を見てくれますか？",
    "もちろん！ しずくの本気が見たい！"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "kanata"
  ],
  "lines": [
   [
    "彼方さん、台本を読んでもらえますか？",
    "いいよ〜。寝る前に一緒に読もうね〜"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "setsuna"
  ],
  "lines": [
   [
    "せつ菜さん、この場面の演技を見てください！",
    "素晴らしいです！ 熱い気持ちが伝わります！"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "emma"
  ],
  "lines": [
   [
    "エマさん、物語のお姫様みたいです",
    "えへへ、しずくちゃんこそ素敵だよ"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "rina"
  ],
  "lines": [
   [
    "璃奈さん、この劇の感想を聞かせてください",
    "胸がどきどきした。すごかった"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "shioriko"
  ],
  "lines": [
   [
    "栞子さん、今度一緒に練習しませんか？",
    "ぜひ。勉強させていただきます"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "mia"
  ],
  "lines": [
   [
    "ミアさんの曲を演技に合わせてみたいです",
    "へえ、面白そう。聴かせてよ"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠さんの堂々とした姿、勉強になります",
    "しずくももっと自信を持ちなさい！"
   ]
  ]
 },
 {
  "ids": [
   "shizuku",
   "yu"
  ],
  "lines": [
   [
    "侑先輩、今日の練習どうでしたか？",
    "しずくちゃんの表情、すごく引き込まれたよ！"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "kanata"
  ],
  "lines": [
   [
    "彼方、また眠っちゃいそうね",
    "果林ちゃんも一緒にお昼寝する〜？"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "setsuna"
  ],
  "lines": [
   [
    "せつ菜、そんなに急いでどこへ？",
    "練習です！ 果林さんも一緒に！"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "rina"
  ],
  "lines": [
   [
    "璃奈、今日はどんな気分？",
    "璃奈ちゃんボード「きらきら」"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "shioriko"
  ],
  "lines": [
   [
    "栞子、少し息抜きしてみたら？",
    "そうですね。果林さん、ありがとうございます"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "mia"
  ],
  "lines": [
   [
    "ミア、その曲なかなかいいじゃない",
    "当然でしょ。もっといいのも作れるよ"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠、今日も自信満々ね",
    "果林も負けないくらい素敵よ！"
   ]
  ]
 },
 {
  "ids": [
   "karin",
   "yu"
  ],
  "lines": [
   [
    "侑、今日のステージはどうだった？",
    "果林さん、すごくかっこよかった！"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "kanata"
  ],
  "lines": [
   [
    "彼方、散歩のあとはお昼寝かな？",
    "愛ちゃんも一緒にごろごろしよ〜"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "setsuna"
  ],
  "lines": [
   [
    "せっつー！ 今日も全開でいこう！",
    "はい！ 愛さんとならさらに燃えます！"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "emma"
  ],
  "lines": [
   [
    "エマっち！ 今日はいい天気だね！",
    "うん。みんなでお散歩したいな"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "shioriko"
  ],
  "lines": [
   [
    "しおってぃー！ 今日も楽しもう！",
    "その呼び方にも少し慣れてきました"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "mia"
  ],
  "lines": [
   [
    "ミアち！ 新曲できたら聴かせてよ！",
    "まあ、愛なら感想を言ってくれそうだね"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "lanzhu"
  ],
  "lines": [
   [
    "ランジュ！ その勢い、最高じゃん！",
    "愛もなかなかやるじゃない！"
   ]
  ]
 },
 {
  "ids": [
   "ai",
   "yu"
  ],
  "lines": [
   [
    "ゆうゆ！ 今日もときめいてる？",
    "もちろん！ 愛ちゃんといると倍増だよ！"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "setsuna"
  ],
  "lines": [
   [
    "せつ菜ちゃん、ちょっと休憩しよ〜",
    "はい！ しっかり休んで全力で戻ります！"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "rina"
  ],
  "lines": [
   [
    "璃奈ちゃん、おやつ半分こしよ〜",
    "いいの？ 彼方さん、ありがとう"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "shioriko"
  ],
  "lines": [
   [
    "栞子ちゃんも頑張りすぎないでね〜",
    "はい。彼方さんもちゃんと起きてください"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "mia"
  ],
  "lines": [
   [
    "ミアちゃん、子守歌を作ってほしいな〜",
    "ボクの曲で寝ないでよ！"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "lanzhu"
  ],
  "lines": [
   [
    "ランジュちゃん、少しのんびりしよ〜",
    "いいわ！ たまには休むのも大事ね！"
   ]
  ]
 },
 {
  "ids": [
   "kanata",
   "yu"
  ],
  "lines": [
   [
    "侑ちゃん、いい夢が見られそうだよ〜",
    "彼方さんの歌を聴くと落ち着くなあ"
   ]
  ]
 },
 {
  "ids": [
   "setsuna",
   "emma"
  ],
  "lines": [
   [
    "エマさん！ 今日は何に挑戦しますか？",
    "せつ菜ちゃんとなら何でも楽しそう！"
   ]
  ]
 },
 {
  "ids": [
   "setsuna",
   "rina"
  ],
  "lines": [
   [
    "璃奈さん、そのアイデア最高です！",
    "ありがとう。せつ菜さんの勢い、好き"
   ]
  ]
 },
 {
  "ids": [
   "setsuna",
   "mia"
  ],
  "lines": [
   [
    "ミアさん！ この曲、最高に熱いです！",
    "そんなに興奮しなくても聞こえてるよ"
   ]
  ]
 },
 {
  "ids": [
   "setsuna",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠さん！ 全力で勝負しましょう！",
    "望むところよ！ ランジュに任せなさい！"
   ]
  ]
 },
 {
  "ids": [
   "emma",
   "rina"
  ],
  "lines": [
   [
    "璃奈ちゃん、一緒におやつ食べよ？",
    "うん。エマさんと食べるとおいしい"
   ]
  ]
 },
 {
  "ids": [
   "emma",
   "shioriko"
  ],
  "lines": [
   [
    "栞子ちゃん、疲れてない？",
    "大丈夫です。エマさんのおかげで元気です"
   ]
  ]
 },
 {
  "ids": [
   "emma",
   "mia"
  ],
  "lines": [
   [
    "ミアちゃん、温かい飲み物どう？",
    "ありがとう。ちょうど飲みたかったんだ"
   ]
  ]
 },
 {
  "ids": [
   "emma",
   "lanzhu"
  ],
  "lines": [
   [
    "ランジュちゃん、今日も楽しそう！",
    "エマも一緒に楽しみましょ！"
   ]
  ]
 },
 {
  "ids": [
   "emma",
   "yu"
  ],
  "lines": [
   [
    "侑ちゃん、今日はどんな曲が好き？",
    "みんなの歌を聴くと胸がときめくよ！"
   ]
  ]
 },
 {
  "ids": [
   "rina",
   "shioriko"
  ],
  "lines": [
   [
    "栞子さん、新しいボードを見て",
    "とても素敵ですね。気持ちが伝わります"
   ]
  ]
 },
 {
  "ids": [
   "rina",
   "lanzhu"
  ],
  "lines": [
   [
    "嵐珠さん、今日もきらきらしてる",
    "当然よ！ 璃奈もとっても素敵よ！"
   ]
  ]
 },
 {
  "ids": [
   "rina",
   "yu"
  ],
  "lines": [
   [
    "侑さん、一緒にゲームしよう",
    "いいね！ 璃奈ちゃんに教えてもらいたい！"
   ]
  ]
 },
 {
  "ids": [
   "shioriko",
   "mia"
  ],
  "lines": [
   [
    "ミアさん、少しお話してもいいですか？",
    "いいよ。栞子ならちゃんと聞いてくれそう"
   ]
  ]
 },
 {
  "ids": [
   "shioriko",
   "yu"
  ],
  "lines": [
   [
    "侑さん、今日の予定を確認しましょう",
    "ありがとう栞子ちゃん！ 頼りになるね"
   ]
  ]
 },
 {
  "ids": [
   "mia",
   "yu"
  ],
  "lines": [
   [
    "侑、いいフレーズができたんだ",
    "ほんと？ 聴かせて！ ときめきそう！"
   ]
  ]
 },
 {
  "ids": [
   "lanzhu",
   "yu"
  ],
  "lines": [
   [
    "侑！ ランジュのステージを見なさい！",
    "もちろん！ すっごく楽しみ！"
   ]
  ]
 }
];
PAIR_DIALOGUES.push(...MORE_PAIR_DIALOGUES);

const YU_ALTERNATIVE_LINES=[["kasumi","侑先輩！ かすみんの新しいポーズどうです？","すっごくかわいい！ 写真撮ってもいい？"],["shizuku","侑先輩、次のステージも見てくださいね","もちろん！ しずくちゃんの歌、楽しみだよ"],["karin","侑、また新しい曲を探してるの？","うん！ 果林さんに似合う曲を考えたいな"],["ai","ゆうゆ！ 新しいときめき発見した？","愛ちゃんの笑顔を見るたび発見してるよ！"],["kanata","侑ちゃん、少し休んでいこうよ〜","うん！ 彼方さんとゆっくりするのもいいね"],["emma","侑ちゃん、今度みんなでピクニックしよう？","行きたい！ みんなの歌も聴けたら最高！"],["rina","侑さん、わたしの気持ち伝わってる？","うん！ 璃奈ちゃんの歌で伝わってるよ！"],["shioriko","侑さん、練習の準備は整いました","ありがとう栞子ちゃん！ みんなで楽しもう！"],["mia","侑、このメロディーどう思う？","すごくいい！ なんだか胸が熱くなるね！"],["lanzhu","侑！ ランジュの次のライブ、絶対来るのよ！","もちろん！ 一番前で応援するよ！"]];
YU_ALTERNATIVE_LINES.forEach(([partner,a,b])=>{
 const match=PAIR_DIALOGUES.find(pair=>pair.ids.includes(partner)&&pair.ids.includes('yu'));
 if(!match)throw new Error('Missing Yu dialogue: '+partner);
 match.lines.push(match.ids[0]==='yu'?[b,a]:[a,b]);
});

const GREETING={
 ayumu:'一緒に歩けるとうれしいな',kasumi:'かすみんとおしゃべりしましょう！',
 shizuku:'お話できてうれしいです',karin:'ふふ、ちょっとお話しない？',
 ai:'やっほー！ 元気してる？',kanata:'少しおしゃべりしよ〜',
 setsuna:'一緒に楽しみましょう！',emma:'会えてうれしいな',
 rina:'話せて、うれしい',shioriko:'こんにちは。お元気ですか？',
 mia:'Hey、何してるの？',lanzhu:'ランジュと話したかったのね！',
 yu:'今日もときめくことがいっぱい！'
};
const REPLIES={
 ayumu:'うん、そうだね！',kasumi:'さすが、分かってますねっ',
 shizuku:'ええ、素敵ですね',karin:'それもいいわね',
 ai:'いいじゃん、楽しもう！',kanata:'そうだね〜',
 setsuna:'はい！ 全力で！',emma:'うん、うれしいよ',
 rina:'うん。わたしも',shioriko:'ええ、よろしくお願いします',
 mia:'まあ、いいんじゃない？',lanzhu:'当然よ！',
 yu:'うん、ときめいちゃった！'
};
let socialEvent=null;
let nextSocialAt=0;
let recentTalkPairs=[];
const speed={slow:24,normal:42,fast:68},size={small:68,medium:88,large:112};
// New members can join by adding their own six-pose frame JSON file.
const LIVE_ASSETS={shioriko:'./mini-live/shioriko-frames.json',ayumu:'./mini-live/ayumu-frames.json',kasumi:'./mini-live/kasumi-frames.json',shizuku:'./mini-live/shizuku-frames.json',karin:'./mini-live/karin-frames.json',ai:'./mini-live/ai-frames.json',kanata:'./mini-live/kanata-frames.json',setsuna:'./mini-live/setsuna-frames.json',emma:'./mini-live/emma-frames.json',rina:'./mini-live/rina-frames.json',mia:'./mini-live/mia-frames.json',lanzhu:'./mini-live/lanzhu-frames.json'};
const LIVE_INTERVALS={rare:[15*60000,25*60000],normal:[7*60000,12*60000],often:[3*60000,5*60000]};
const liveCache=new Map();
let liveEvent=null,nextLiveAt=Infinity,liveLoading=false,liveGeneration=0;
function scheduleLive(now=performance.now()){
  const range=S.liveMode==='off'?null:[5000,7500];
  nextLiveAt=range ? now+range[0]+Math.random()*(range[1]-range[0]) : Infinity;
}
async function getLiveFrames(id){
  if(!LIVE_ASSETS[id])return null;
  if(!liveCache.has(id)){
    const loader=(async()=>{
      const response=await fetch(LIVE_ASSETS[id]);
      if(!response.ok)throw new Error('Live frames unavailable');
      const data=await response.json();
      if(!Array.isArray(data.frames)||data.frames.length<2||
         !Array.isArray(data.sequence)||!data.sequence.length ||
         data.frames.some(src=>typeof src!=='string'||!src.startsWith('data:image/'))||
         data.sequence.some(n=>!Number.isInteger(n)||n<0||n>=data.frames.length)){
        throw new Error('Invalid live frames');
      }
      await Promise.all(data.frames.map(src=>new Promise((resolve,reject)=>{
        const im=new Image();
        im.onload=resolve;im.onerror=reject;im.src=src;
      })));
      return data;
    })().catch(err=>{liveCache.delete(id);throw err});
    liveCache.set(id,loader);
  }
  return liveCache.get(id);
}
const LIVE_CALLS={ayumu:'みんな、ライブ始めるよ！',kasumi:'かすみんたちのライブ、始めちゃいますよ〜！',shizuku:'私たちのライブ、ぜひ見てください！',karin:'さあ、ライブを始めるわよ',ai:'みんなー！ライブやるよー！',kanata:'ライブ、始めちゃおっか〜',setsuna:'みなさん！ライブを始めますよー！',emma:'みんな、一緒に楽しもう！ライブだよ〜！',rina:'ライブ、始める。璃奈ちゃんボード「わくわく」',shioriko:'これからライブを始めます！',mia:'ライブ、始めるよ。ちゃんと見ててよね',lanzhu:'ランジュたちのライブ、始めるわよ！'};
const YU_CHEERS=['みんな最高ー！','がんばってー！','ときめいちゃう！','1人だけなんて選べないよー！','みんな大好きー！'];
function endLive(now=performance.now()){
 if(!liveEvent)return;
 for(const a of [...liveEvent.members,liveEvent.yu].filter(Boolean)){
  a.performing=false;a.liveImage?.remove();a.liveImage=null;
  a.el.classList.remove('mascot-live-active','mascot-yu-cheering');hideSpeech(a);
  a.frame=0;a.lastF=now;a.pose=now+300;a.restUntil=0;
  if(actors.length>1)setV(a,Math.random()*Math.PI*2);
 }
 liveEvent=null;
 nextLiveAt=now+5000+Math.random()*2500;
}
async function beginLive(manual=false){
 if(liveLoading||liveEvent||S.lineup||!S.moving||document.hidden||
    socialEvent||document.querySelector('dialog[open]'))return false;
 const yu=actors.find(a=>a.id==='yu');
 const eligible=actors.filter(a=>LIVE_ASSETS[a.id]&&!a.performing);
 if(!yu||eligible.length<3||(!manual&&actors.length!==Object.keys(C).length)){
  if(!manual)nextLiveAt=performance.now()+5000;
  return false;
 }
 const caller=eligible[Math.floor(Math.random()*eligible.length)];
 const pool=eligible.filter(a=>a!==caller);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}const others=pool.slice(0,2);
 const members=[caller,...others],serial=liveGeneration;
 liveLoading=true;
 let frames;
 try{frames=await Promise.all(members.map(a=>getLiveFrames(a.id)))}
 catch(err){console.warn('Mascot mini-live:',err);nextLiveAt=performance.now()+5000;return false}
 finally{liveLoading=false}
 if(serial!==liveGeneration||members.some(a=>!actors.includes(a))||!actors.includes(yu)||
    liveEvent||S.lineup||!S.moving||document.hidden)return false;
 const now=performance.now();
 members.forEach(a=>hideSpeech(a));hideSpeech(yu);
 const centerX=members.reduce((sum,a)=>sum+a.x+a.w/2,0)/3;
 const centerY=members.reduce((sum,a)=>sum+a.y+a.h/2,0)/3;
 members.forEach((a,i)=>{
  const q=box(a);
  a.x=Math.max(q.l,Math.min(q.r,centerX+(i-1)*a.w*1.12-a.w/2));
  a.y=Math.max(q.t,Math.min(q.b,centerY-a.h/2));
  const image=document.createElement('img');
  image.className='mascot-live-frame';image.alt='';image.draggable=false;
  const ratio=metrics.get(a.id)?.visibleRatio||.76;
  image.style.height=a.h*ratio+'px';image.style.bottom=a.h*(1-ratio)*.35+'px';
  image.src=frames[i].frames[frames[i].sequence[0]];
  a.el.appendChild(image);a.liveImage=image;a.performing=true;
  a.el.classList.add('mascot-live-active');
 });
 yu.performing=true;
 yu.el.classList.add('mascot-yu-cheering');
 const yq=box(yu);
 yu.x=Math.max(yq.l,Math.min(yq.r,centerX-yu.w/2));
 yu.y=Math.max(yq.t,Math.min(yq.b,centerY+yu.h*.65));
 liveEvent={members,frames,yu,caller,started:now,until:now+12000,frame:-1,cheer:-1,phase:'intro',centerX};
 say(caller,LIVE_CALLS[caller.id],1700);
 return true;
}
function updateLive(now){
 if(!liveEvent)return;
 const e=liveEvent,elapsed=now-e.started;
 if(now>=e.until){endLive(now);return}
 if(elapsed<1700)return;
 if(e.phase==='intro'){e.phase='dance';hideSpeech(e.caller)}
 const step=Math.floor((elapsed-1700)/270);
 if(step!==e.frame){
  e.frame=step;
  e.members.forEach((a,i)=>{
   const data=e.frames[i];
   a.liveImage.src=data.frames[data.sequence[step%data.sequence.length]];
  });
 }
 const cheer=Math.floor((elapsed-1700)/1900);
 if(cheer!==e.cheer){
  e.cheer=cheer;
  const line=cheer===2?'1人だけなんて選べないよー！':YU_CHEERS[cheer%YU_CHEERS.length];
  say(e.yu,line,1550);
 }
 const y=e.yu,q=box(y);
 y.x=Math.max(q.l,Math.min(q.r,e.centerX-y.w/2+Math.sin(elapsed/580)*y.w*1.45));
 y.frame=Math.floor(elapsed/180)%4;
 y.y=Math.max(q.t,Math.min(q.b,e.members[1].y+y.h*.65+Math.abs(Math.sin(elapsed/290))*y.h*.12));
}
let S=load(),root,layer,dialog,status,lineupButton,actors=[],last=0,metrics=new Map(),rebuildSerial=0;
function valid(a){return [...new Set((Array.isArray(a)?a:[]).filter(x=>C[x]))]}
function load(){
  const defaults={enabled:true,moving:true,speech:true,lineup:false,size:'medium',speed:'normal',liveMode:'normal'};
  try{
    const raw=localStorage.getItem(KEY);
    if(raw!==null){
      const stored=JSON.parse(raw)||{};
      // An intentionally empty selection is NOT an error or a legacy migration.
      return {...defaults,...stored,enabled:true,selectedCharacters:valid(stored.selectedCharacters)};
    }
    const old=JSON.parse(localStorage.getItem(OLD)||'{}');
    const selected=old.character&&C[old.character]?[old.character]:['shioriko'];
    return {...defaults,...old,enabled:true,selectedCharacters:selected};
  }catch(_){
    return {...defaults,selectedCharacters:['shioriko']};
  }
}
function save(){
  S.enabled=true;
  S.selectedCharacters=valid(S.selectedCharacters);
  try{
    localStorage.setItem(KEY,JSON.stringify(S));
    // Keep existing legacy settings compatible without overriding zero selection.
    localStorage.setItem(OLD,JSON.stringify({
      enabled:true,character:S.selectedCharacters[0]||'',
      moving:S.moving,speech:S.speech,size:S.size,speed:S.speed
    }));
  }catch(_){}
}
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
function setV(a,ang=Math.atan2(a.vy,a.vx)){let v=(speed[S.speed]||42)*(PERSONALITY[a.id]?.pace||1);a.vx=Math.cos(ang)*v;a.vy=Math.sin(ang)*v;a.d=dir(a)}
function render(a,now){
  if(a.id==='kanata'){
    if(!a.performing&&!S.lineup&&now<(a.restUntil||0))a.el.classList.add('mascot-napping');
    else a.el.classList.remove('mascot-napping');
  }let m=metrics.get(a.id)||{fw:272,fh:217},pose=(S.lineup||now<a.pose||now<(a.restUntil||0)||!S.moving)?'idle':a.d,sc=a.h/m.fh,f=a.frame%4,b=(pose==='idle'?0:[0,-4,0,-2][f]*Math.max(.65,Math.min(1.15,a.h/88)));if(S.lineup)positionLineupActor(a);a.el.style.width=a.w+'px';a.el.style.height=a.h+'px';a.el.style.setProperty('--mascot-image','url("'+sprite(a.id)+'")');a.el.style.setProperty('--mascot-sheet-width',(m.fw*4*sc)+'px');a.el.style.setProperty('--mascot-sheet-height',(m.fh*5*sc)+'px');a.el.style.setProperty('--mascot-frame-x',(-m.fw*f*sc)+'px');a.el.style.setProperty('--mascot-frame-y',(-m.fh*row(pose)*sc)+'px');a.el.style.transform='translate3d('+a.x+'px,'+(a.y+b)+'px,0)'}
function pose(a,now,ms=800){a.pose=Math.max(a.pose,now+ms);a.frame=Math.floor(Math.random()*4);a.el.classList.remove('mascot-collision-pose');void a.el.offsetWidth;a.el.classList.add('mascot-collision-pose');setTimeout(()=>a.el&&a.el.classList.remove('mascot-collision-pose'),ms)}
function bubble(a){if(!S.speech)return;const p=P[a.id]||[C[a.id][0]+'です！'];say(a,p[Math.floor(Math.random()*p.length)],3000)}
function actor(id){let d=dims(id),el=document.createElement('button'),b=document.createElement('div');el.type='button';el.className='edge-mascot mascot-sprite mascot-actor';el.setAttribute('aria-label',C[id][0]+'マスコット');b.className='mascot-bubble mascot-actor-bubble';b.hidden=true;let a={id,el,b,w:d.w,h:d.h,x:0,y:0,vx:0,vy:0,d:'right',frame:0,lastF:0,pose:0,cool:0,bt:null,restUntil:0,nextRest:performance.now()+(PERSONALITY[id]?.rest||17000)*(.7+Math.random()*.6),nextTurn:performance.now()+(PERSONALITY[id]?.turn||12000)*(.7+Math.random()*.7)};el.addEventListener('click',()=>{if(a.performing){endLive(performance.now());return}let n=performance.now();pose(a,n,1100);bubble(a)});layer.append(el,b);return a}
function spriteIdleBounds(image,fw,fh){
  const fallback={cx:.5,bottom:.92,height:.76,width:.60};
  try{
    const w=Math.round(fw),h=Math.round(fh);
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return Array(4).fill(fallback);
    const bounds=[];
    for(let frame=0;frame<4;frame++){
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(image,frame*fw,4*fh,fw,fh,0,0,w,h);
      const rgba=ctx.getImageData(0,0,w,h).data;
      let x0=w,x1=-1,y0=h,y1=-1;
      for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
        if(rgba[(y*w+x)*4+3]>85){
          x0=Math.min(x0,x);x1=Math.max(x1,x);
          y0=Math.min(y0,y);y1=Math.max(y1,y);
        }
      }
      bounds.push(x1<0?fallback:{
        cx:(x0+x1+2)/(2*w),
        bottom:Math.min(1,(y1+2)/h),
        height:Math.max(.1,(y1-y0+2)/h),
        width:Math.max(.1,(x1-x0+2)/w)
      });
    }
    return bounds;
  }catch(_){return Array(4).fill(fallback)}
}
function loadMetric(id){return new Promise(res=>{let i=new Image();i.onload=()=>{
  const fw=i.naturalWidth/4,fh=i.naturalHeight/5;
  if(!fw||!fh){res(false);return}
  metrics.set(id,{
    fw,fh,
    visibleRatio:spriteVisibleRatio(i,fw,fh),
    idleBounds:spriteIdleBounds(i,fw,fh)
  });
  res(true)
};i.onerror=()=>res(false);i.src=sprite(id)})}
async function rebuild(){
  liveGeneration++;
  endLive(performance.now());
  const serial=++rebuildSerial;
  actors.forEach(a=>{clearTimeout(a.bt);a.el.remove();a.b.remove()});
  actors=[];
  socialEvent=null;
  recentTalkPairs=[];
  nextSocialAt=performance.now()+2300;
  S.selectedCharacters=valid(S.selectedCharacters);
  save();
  if(!S.selectedCharacters.length){
    scheduleLive();
    visible();
    syncStatus();
    return;
  }
  const ids=[...S.selectedCharacters];
  const results=await Promise.all(ids.map(async id=>[id,await loadMetric(id)]));
  if(serial!==rebuildSerial)return; // Ignore older async image-load results.
  results.filter(x=>x[1]).forEach(([id])=>actors.push(actor(id)));
  if(actors.length)place();
  scheduleLive();
  visible();
  syncStatus(actors.length?'':'キャラクター画像を読み込めませんでした');
}
function placeLineup(){
  const order=Object.keys(C);
  const sorted=[...actors].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  if(!sorted.length)return;
  const count=sorted.length;
  const leftCount=Math.ceil(count/2);
  const leftColumn=sorted.slice(0,leftCount);
  const rightColumn=sorted.slice(leftCount);
  const style=getComputedStyle(document.documentElement);
  const safeTop=parseFloat(style.getPropertyValue('--mascot-safe-top'))||0;
  const safeBottom=parseFloat(style.getPropertyValue('--mascot-safe-bottom'))||0;
  const safeLeft=parseFloat(style.getPropertyValue('--mascot-safe-left'))||0;
  const safeRight=parseFloat(style.getPropertyValue('--mascot-safe-right'))||0;

  // Use a SINGLE seven-slot vertical grid on both sides, even if right has six.
  // The unused bottom-right slot holds the settings and lineup buttons.
  const top=Math.max(safeTop+48,54);
  const bottom=Math.max(top+24,innerHeight-safeBottom-12);
  const slot=(bottom-top)/leftCount;
  const columnWidth=Math.max(1,(innerWidth-safeLeft-safeRight-18)/2);
  const desiredVisible=(size[S.size]||88)*.98;

  const source=sorted.map(a=>{
    const metric=metrics.get(a.id)||{fw:272,fh:217};
    const bounds=metric.idleBounds||[{cx:.5,bottom:.92,height:.76,width:.6}];
    const heightFractions=bounds.map(b=>b.height).sort((a,b)=>a-b);
    const visibleHeight=heightFractions[Math.floor(heightFractions.length/2)]||.76;
    const largestWidth=Math.max(...bounds.map(b=>b.width));
    const h=desiredVisible/Math.max(.2,visibleHeight);
    const w=h*metric.fw/metric.fh;
    return {a,h,w,visibleHeight,largestWidth};
  });

  // One common multiplier keeps every character's visible height consistent.
  const fit=Math.min(1,...source.map(x=>Math.min(
    Math.max(.02,(slot-5)/(x.h*x.visibleHeight)),
    Math.max(.02,(columnWidth-16)/(x.w*x.largestWidth))
  )));
  source.forEach(x=>{x.a.w=x.w*fit;x.a.h=x.h*fit;});

  const maxVisualWidth=Math.max(...source.map(x=>x.w*x.largestWidth*fit));
  const sideOffset=Math.max(12+maxVisualWidth/2,Math.min(columnWidth/2,60));
  const leftAnchor=safeLeft+sideOffset;
  const rightAnchor=innerWidth-safeRight-sideOffset;

  function arrange(column,anchor){
    column.forEach((a,index)=>{
      // A shared baseline for corresponding members on both sides.
      a.anchorX=anchor;
      a.anchorBottom=top+(index+1)*slot-3;
      a.d='down';a.vx=0;a.vy=0;
      a.pose=0;a.frame=0;a.lastF=0;
      positionLineupActor(a);
    });
  }
  arrange(leftColumn,leftAnchor);
  arrange(rightColumn,rightAnchor);
  root.style.setProperty('--mascot-lineup-height','0px');
  root.classList.add('mascot-lineup-active');
}
// Correct for alpha padding in each idle pose so feet and horizontal center
// stay fixed when changing frames, rather than shifting the whole character.
function positionLineupActor(a){
  const metric=metrics.get(a.id);
  const current=(metric?.idleBounds||[])[a.frame%4]||{cx:.5,bottom:.92};
  a.x=a.anchorX-current.cx*a.w;
  a.y=a.anchorBottom-current.bottom*a.h;
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
      a.x=q.l;a.y=q.b;a.d='right';a.vx=(speed[S.speed]||42)*(PERSONALITY[a.id]?.pace||1);a.vy=0;
    }
  });
}
function visible(){layer.hidden=!actors.length;if(!S.speech)actors.forEach(a=>a.b.hidden=true)}

// Approximate the visible artwork, not the transparent sprite cell.
// This makes the speech pointer sit just above the speaker's head.
function mascotVisibleBox(a){
  const bounds=S.lineup?(metrics.get(a.id)?.idleBounds||[])[a.frame%4]:null;
  const cx=bounds?.cx??.5;
  const bottom=bounds?.bottom??.94;
  const h=bounds?.height??(metrics.get(a.id)?.visibleRatio||.76);
  const width=bounds?.width??.68;
  const center=a.x+a.w*cx;
  return {
    left:center-a.w*width/2, right:center+a.w*width/2,
    top:a.y+a.h*(bottom-h), bottom:a.y+a.h*bottom,
    center
  };
}
function overlapArea(a,b){
  if(!a||!b)return 0;
  return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
         Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
}
function bubbleDimensions(a,maxAllowed=Infinity){
  const el=a.b;
  const max=Math.max(80,Math.min(194,innerWidth-16,maxAllowed));
  const length=Array.from(el.textContent||'').length;
  const w=Math.max(Math.min(106,max),Math.min(max,Math.ceil(length*13+26)));
  // Set width before measuring actual wrapped text so multi-line bubbles
  // never overlap the speaker because of underestimated heights.
  el.style.width=w+'px';
  el.style.maxWidth=w+'px';
  const measured=el.getBoundingClientRect?.().height||el.offsetHeight||0;
  const lines=Math.max(1,Math.ceil(length*13/Math.max(45,w-28)));
  const h=measured>0?measured:lines*19+22;
  return{w,h};
}
function bubblePlacement(a){
  if(!a?.b||a.b.hidden)return;
  const avatar=mascotVisibleBox(a);
  const partner=socialEvent?.phase==='talk'?
    (socialEvent.a===a?socialEvent.b:socialEvent.b===a?socialEvent.a:null):null;
  const other=partner?mascotVisibleBox(partner):null;
  const {w,h}=bubbleDimensions(a);
  const styles=getComputedStyle(document.documentElement);
  const safeTop=parseFloat(styles.getPropertyValue('--mascot-safe-top'))||0;
  const margin=6;

  // A bubble must stay ABOVE the speaking character, including near screen top.
  // Normal walkers can shift downward slightly to make headroom; lineup stays fixed.
  const requiredTop=safeTop+margin+h+5;
  if(!S.lineup&&avatar.top<requiredTop){
    const q=box(a);
    a.y=Math.min(q.b,a.y+requiredTop-avatar.top);
  }
  const speaker=mascotVisibleBox(a);
  const maxX=Math.max(8,innerWidth-w-8);
  const clampX=x=>Math.min(maxX,Math.max(8,x));
  const wantedTop=speaker.top-h-5;
  const top=Math.max(4,wantedTop); // Stay above the sprite even near the safe-area boundary.
  const topChoices=[top];
  // If a conversation partner is standing directly above the speaker,
  // we may need to lift the bubble above that partner as well.
  if(other&&other.top<speaker.top)
    topChoices.push(Math.max(4,Math.min(top,other.top-h-7)));
  const defaultX=clampX(speaker.center-w/2);
  const xs=[defaultX];
  // First try directly overhead; then either upper corner, away from the partner.
  const left=clampX(speaker.center-w+16);
  const right=clampX(speaker.center-16);
  const partnerOnRight=!!other&&other.center>=speaker.center;
  xs.push(...(partnerOnRight?[left,right]:[right,left]));
  xs.push(clampX(speaker.left-w-5),clampX(speaker.right+5));
  xs.push(8,maxX);
  const existing=actors.filter(x=>x!==a&&x!==partner&&!x.b.hidden);
  let chosen=defaultX,chosenTop=top,score=Infinity;
  for(const y of [...new Set(topChoices)])for(const x of [...new Set(xs)]){
    const rect={left:x,right:x+w,top:y,bottom:y+h};
    // Avoid BOTH characters before optimizing closeness to the speaker.
    const partnerObstruction=overlapArea(rect,other);
    const speakerObstruction=overlapArea(rect,speaker);
    const otherBubbleObstruction=existing.reduce((sum,person)=>{
      const p=person.b.getBoundingClientRect?.();
      return p?sum+overlapArea(rect,p):sum;
    },0);
    const value=(partnerObstruction+speakerObstruction)*100+
      otherBubbleObstruction*20+
      Math.abs(x-defaultX)*.14+Math.abs(y-top)*.3;
    if(value<score){score=value;chosen=x;chosenTop=y}
  }
  let finalWidth=w;
  // A narrower, wrapped bubble can tuck into an upper corner beside the
  // conversation partner instead of floating far above both characters.
  if(other&&score>8){
    for(const cap of [154,128]){
      if(w<=cap)continue;
      const narrow=bubbleDimensions(a,cap);
      const nw=narrow.w,nh=narrow.h,maxN=Math.max(8,innerWidth-nw-8);
      const clipX=x=>Math.max(8,Math.min(maxN,x));
      const nearY=speaker.top-nh-5;
      if(nearY<4)continue;
      const leftX=clipX(speaker.left-nw-5),rightX=clipX(speaker.right+5);
      const otherSide=other.center>=speaker.center?[leftX,rightX]:[rightX,leftX];
      const nxOptions=[clipX(speaker.center-nw/2),...otherSide,8,maxN];
      const nyOptions=[nearY];
      if(other.top<speaker.top)nyOptions.push(Math.max(4,Math.min(nearY,other.top-nh-7)));
      for(const y of nyOptions)for(const x of [...new Set(nxOptions)]){
        const rect={left:x,right:x+nw,top:y,bottom:y+nh};
        const obstruction=overlapArea(rect,other)+overlapArea(rect,speaker);
        const value=obstruction*100+Math.abs(x-defaultX)*.14+
          Math.abs(y-top)*.3+(w-nw)*.22;
        if(value<score){score=value;chosen=x;chosenTop=y;finalWidth=nw}
      }
    }
  }
  a.b.style.width=finalWidth+'px';
  a.b.style.maxWidth=finalWidth+'px';
  a.b.style.left=chosen+'px';
  a.b.style.top=chosenTop+'px';
  const pointer=Math.max(11,Math.min(finalWidth-11,speaker.center-chosen));
  a.b.style.setProperty('--bubble-tail-x',pointer+'px');
}
function say(a,text,ms=3000){
  if(!S.speech||!a?.b)return;
  a.b.textContent=text;
  a.b.hidden=false;
  bubblePlacement(a);
  clearTimeout(a.bt);
  a.bt=setTimeout(()=>{a.b.hidden=true},ms);
}
function hideSpeech(a){
  if(!a?.b)return;
  clearTimeout(a.bt);
  a.b.hidden=true;
}
function scheduleNextConversation(now){
  nextSocialAt=now+4500+Math.random()*2800;
}
function pairLines(a,b){
  const match=PAIR_DIALOGUES.find(pair=>
    (pair.ids[0]===a.id&&pair.ids[1]===b.id)||
    (pair.ids[1]===a.id&&pair.ids[0]===b.id)
  );
  if(!match)return [GREETING[a.id],REPLIES[b.id]];
  const lines=match.lines[Math.floor(Math.random()*match.lines.length)];
  return match.ids[0]===a.id?lines:[lines[1],lines[0]];
}
function bonded(a,b){
  return BONDS.some(([x,y])=>(x===a.id&&y===b.id)||(x===b.id&&y===a.id));
}
function talkPairKey(a,b){return [a.id,b.id].sort().join(':')}
function chooseSocialPair(){
  if(actors.length<2)return null;
  const possibilities=[];
  // All pairs participate. Yu gets a modest selection advantage after distance balancing;
  // unlike the previous forced/queued Yu dialogue, no pair pre-empts another.
  for(let i=0;i<actors.length;i++){
    for(let j=i+1;j<actors.length;j++){
      const a=actors[i],b=actors[j];
      const distance=Math.hypot(a.x+a.w/2-b.x-b.w/2,
                                a.y+a.h/2-b.y-b.h/2);
      let weight=1/(1+distance/235);
      weight*=weight;
      if(bonded(a,b))weight*=1.25;
      if(a.id==='yu'||b.id==='yu')weight*=1.80;
      if(recentTalkPairs.includes(talkPairKey(a,b)))weight*=.13;
      possibilities.push({a,b,weight});
    }
  }
  const total=possibilities.reduce((sum,pair)=>sum+pair.weight,0);
  let target=Math.random()*total;
  for(const item of possibilities){
    target-=item.weight;
    if(target<=0)return [item.a,item.b];
  }
  const last=possibilities[possibilities.length-1];
  return [last.a,last.b];
}
function beginConversation(e,now){
  // Respect the authored order, so a reply never appears before the greeting.
  const authored=PAIR_DIALOGUES.find(pair=>
    pair.ids.includes(e.a.id)&&pair.ids.includes(e.b.id));
  if(authored&&authored.ids[0]===e.b.id){
    const swap=e.a;e.a=e.b;e.b=swap;
  }
  const {a,b}=e;
  a.restUntil=0;b.restUntil=0;
  a.pose=Math.max(a.pose,now+6650);
  b.pose=Math.max(b.pose,now+6650);
  if(!S.lineup){
    a.d=a.x<=b.x?'right':'left';
    b.d=b.x>a.x?'left':'right';
  }
  e.phase='talk';e.started=now;e.until=now+6650;e.secondSpoken=false;
  recentTalkPairs.push(talkPairKey(a,b));
  if(recentTalkPairs.length>4)recentTalkPairs.shift();
  e.lines=pairLines(a,b);
  actors.forEach(person=>{if(person!==a)hideSpeech(person)});
  say(a,e.lines[0],3150);
}
function endConversation(now){
  if(socialEvent){
    hideSpeech(socialEvent.a);hideSpeech(socialEvent.b);
  }
  socialEvent=null;
  scheduleNextConversation(now);
}
function updateSocial(now){
  if((!S.moving&&!S.lineup)||actors.length<2){
    if(socialEvent)endConversation(now);
    return;
  }
  if(!socialEvent){
    if(now<nextSocialAt)return;
    const pair=chooseSocialPair();
    if(!pair)return;
    socialEvent={a:pair[0],b:pair[1],phase:S.lineup?'talk':'approach',until:now+5800};
    socialEvent.a.restUntil=0;
    socialEvent.b.restUntil=0;
    if(S.lineup)beginConversation(socialEvent,now);
  }
  const e=socialEvent,a=e.a,b=e.b;
  if(!actors.includes(a)||!actors.includes(b)){
    endConversation(now);return;
  }
  if(S.lineup&&e.phase!=='talk'){
    endConversation(now);return;
  }
  if(e.phase==='approach'){
    const dx=b.x+b.w/2-a.x-a.w/2;
    const dy=b.y+b.h/2-a.y-a.h/2;
    const distance=Math.hypot(dx,dy);
    if(distance<=(a.w+b.w)*.48+22||now>=e.until){
      beginConversation(e,now);return;
    }
    const angle=Math.atan2(dy,dx);
    setV(a,angle);
    setV(b,angle+Math.PI);
    // Brief brisk approach so players can see the meeting happen.
    a.vx*=1.75;a.vy*=1.75;
    b.vx*=1.75;b.vy*=1.75;
    a.restUntil=0;b.restUntil=0;
  }else if(e.phase==='talk'){
    if(!e.secondSpoken&&now>=e.started+3250){
      e.secondSpoken=true;
      hideSpeech(a);
      say(b,e.lines[1],3100);
    }
    if(now>=e.until){
      hideSpeech(a);hideSpeech(b);
      a.pose=0;b.pose=0;
      if(S.lineup){
        endConversation(now);
      }else if(bonded(a,b)){
        e.phase='follow';e.until=now+5700;
        e.leader=a;e.follower=b;
        setV(a,Math.random()*Math.PI*2);
        setV(b,Math.atan2(a.y-b.y,a.x-b.x));
      }else{
        endConversation(now);
        setV(a,Math.random()*Math.PI*2);
        setV(b,Math.random()*Math.PI*2);
      }
    }
  }else if(e.phase==='follow'){
    if(now>=e.until){
      setV(b,Math.random()*Math.PI*2);
      endConversation(now);return;
    }
    const leader=e.leader,follower=e.follower;
    leader.restUntil=0;follower.restUntil=0;
    const length=Math.hypot(leader.vx,leader.vy)||1;
    const trail=45+Math.min(leader.w,follower.w)*.15;
    const x=leader.x-leader.vx/length*trail;
    const y=leader.y-leader.vy/length*trail;
    if(Math.hypot(x-follower.x,y-follower.y)>32)
      setV(follower,Math.atan2(y-follower.y,x-follower.x));
    else setV(follower,Math.atan2(leader.vy,leader.vx));
  }
}
function maybeSoloSpeech(now){
  if(actors.length!==1||!S.speech||now<nextSocialAt)return;
  const a=actors[0];
  const list=P[a.id]||[GREETING[a.id]];
  say(a,list[Math.floor(Math.random()*list.length)],3400);
  nextSocialAt=now+8500+Math.random()*4500;
}
function updatePersonality(a,now,multi){
  if(!S.moving)return;
  if(socialEvent&&(socialEvent.a===a||socialEvent.b===a))return;
  const p=PERSONALITY[a.id];
  if(!p)return;
  if(now>=a.nextRest){
    a.restUntil=now+p.restMs*(.8+Math.random()*.6);
    a.nextRest=now+p.rest*(.8+Math.random()*.5);
    a.frame=0;
    a.lastF=now;
  }
  if(multi&&now>=a.nextTurn&&now>=a.restUntil&&now>=a.pose){
    const angle=Math.atan2(a.vy,a.vx);
    const change=(Math.random()-.5)*(a.id==='rina'||a.id==='setsuna'?1.45:.85);
    setV(a,angle+change);
    a.nextTurn=now+p.turn*(.75+Math.random()*.7);
  }
}
function wall(a,now){let q=box(a),hit=false;if(a.x<q.l){a.x=q.l;a.vx=Math.abs(a.vx);hit=true}else if(a.x>q.r){a.x=q.r;a.vx=-Math.abs(a.vx);hit=true}if(a.y<q.t){a.y=q.t;a.vy=Math.abs(a.vy);hit=true}else if(a.y>q.b){a.y=q.b;a.vy=-Math.abs(a.vy);hit=true}if(hit&&now>a.cool){setV(a,Math.atan2(a.vy,a.vx)+(Math.random()-.5)*.5);a.cool=now+650;pose(a,now,700)}}
function collide(now){for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){let a=actors[i],b=actors[j];if(a.performing||b.performing||now<a.cool||now<b.cool)continue;if(socialEvent&&((socialEvent.a===a&&socialEvent.b===b)||(socialEvent.a===b&&socialEvent.b===a)))continue;if(socialEvent&&socialEvent.phase==='talk'&&[socialEvent.a,socialEvent.b].some(person=>person===a||person===b))continue;let ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2,dx=bx-ax,dy=by-ay,di=Math.hypot(dx,dy),mi=Math.min(a.w,a.h)*.32+Math.min(b.w,b.h)*.32;if(di>0&&di<mi){
  // Physical encounters may start a conversation sooner, without overlapping
  // an existing event or turning an opted-out speech setting back on.
  if(!socialEvent&&S.speech&&now>=nextSocialAt-2000&&Math.random()<(a.id==='yu'||b.id==='yu' ? .70 : .65)){
    socialEvent={a,b,phase:'talk',until:0};
    beginConversation(socialEvent,now);
    a.cool=b.cool=now+1500;
    return;
  }
  let nx=dx/di,ny=dy/di,o=mi-di;a.x-=nx*o/2;a.y-=ny*o/2;b.x+=nx*o/2;b.y+=ny*o/2;setV(a,Math.atan2(-ny,-nx)+(Math.random()-.5)*.7);setV(b,Math.atan2(ny,nx)+(Math.random()-.5)*.7);a.cool=b.cool=now+850;pose(a,now,850);pose(b,now,850)}}}
function single(a,dist,now){let q=box(a);if(a.d==='right'){a.x+=dist;if(a.x>=q.r){a.x=q.r;a.d='down';pose(a,now)}}else if(a.d==='down'){a.y+=dist;if(a.y>=q.b){a.y=q.b;a.d='left';pose(a,now)}}else if(a.d==='left'){a.x-=dist;if(a.x<=q.l){a.x=q.l;a.d='up';pose(a,now)}}else{a.y-=dist;if(a.y<=q.t){a.y=q.t;a.d='right';pose(a,now)}}}
function tick(now){
  const dt=Math.min(50,now-(last||now));last=now;
  if(!liveEvent&&now>=nextLiveAt&&!liveLoading&&S.moving&&!S.lineup){
    // Keep the due time until a conversation finishes, rather than skipping a show.
    if(!socialEvent&&!document.hidden&&!document.querySelector('dialog[open]'))
      void beginLive(false);
  }
  updateLive(now);
  if(actors.length){
    if(S.lineup){
      if(!liveEvent){if(actors.length>1)updateSocial(now);else maybeSoloSpeech(now)}
      actors.forEach(a=>{
        if(now-a.lastF>=850){a.frame=(a.frame+1)%4;a.lastF=now}
        render(a,now);
        bubblePlacement(a);
      });
    }else{
      const multi=actors.length>1,dist=(speed[S.speed]||42)*dt/1000;
      if(!liveEvent){if(multi&&S.moving)updateSocial(now);
      else if(socialEvent)endConversation(now);
      else if(!multi)maybeSoloSpeech(now)}
      actors.forEach(a=>{
        if(a.performing){a.lastF=now;return}
        updatePersonality(a,now,multi);
        const paused=now<a.pose||now<a.restUntil||!S.moving;
        if(!paused){
          if(multi){
            a.x+=a.vx*dt/1000;a.y+=a.vy*dt/1000;
            wall(a,now);a.d=dir(a);
          }else single(a,dist*(PERSONALITY[a.id]?.pace||1),now);
        }
        const iv=paused?520:190;
        if(now-a.lastF>=iv){a.frame=(a.frame+1)%4;a.lastF=now}
      });
      if(multi&&S.moving){
        collide(now);
      }
      actors.forEach(a=>{render(a,now);bubblePlacement(a)});
    }
  }
  requestAnimationFrame(tick);
}
function selected(){return[...dialog.querySelectorAll('[data-char]:checked')].map(x=>x.value)}
function syncStatus(msg=''){
  if(status)status.textContent=msg||(!S.selectedCharacters.length?'0人選択中：マスコット非表示':S.lineup?'整列中：その場でポーズを切り替えます':S.selectedCharacters.length===1?'1人選択中：外周を歩きます':S.selectedCharacters.length+'人選択中：自由に歩きます');
  if(lineupButton){
    lineupButton.textContent=S.lineup?'歩行':'整列';
    lineupButton.setAttribute('aria-label',S.lineup?'通常歩行に戻す':'キャラクターを画面左右に縦に整列');
    lineupButton.setAttribute('aria-pressed',S.lineup?'true':'false');
  }
}
function sync(){dialog.querySelector('#mLiveMode').value=LIVE_INTERVALS[S.liveMode]?S.liveMode:'off';dialog.querySelector('#mMoving').checked=S.moving;dialog.querySelector('#mSpeech').checked=S.speech;dialog.querySelector('#mSize').value=S.size;dialog.querySelector('#mSpeed').value=S.speed;let set=new Set(S.selectedCharacters);dialog.querySelectorAll('[data-char]').forEach(x=>x.checked=set.has(x.value));syncStatus()}
function ui(){root=document.createElement('div');root.id=ROOT;root.className='mascot-root';layer=document.createElement('div');layer.className='mascot-layer';let gear=document.createElement('button');gear.type='button';gear.className='mascot-settings-btn';gear.textContent='⚙';
  lineupButton=document.createElement('button');
  lineupButton.type='button';
  lineupButton.className='mascot-lineup-btn';
  lineupButton.textContent='整列';
  lineupButton.addEventListener('click',()=>{
    endLive(performance.now());liveGeneration++;if(socialEvent)endConversation(performance.now());S.lineup=!S.lineup;nextSocialAt=performance.now()+2400;save();place();syncStatus();
    actors.forEach(a=>render(a,performance.now()));
  });
  dialog=document.createElement('dialog');dialog.className='mascot-dialog';dialog.innerHTML=`
  <form method="dialog" class="mascot-dialog-card">
    <header class="mascot-dialog-head">
      <div class="mascot-dialog-heading">
        <h2>マスコット設定</h2>
        <p>1人：外周 ／ 2人以上：自由歩行</p>
      </div>
      <button class="ghost-btn mascot-close-btn" value="close" type="submit">閉じる</button>
    </header>
    <section class="mascot-character-panel">
      <div class="mascot-character-head">
        <span>表示するキャラクター</span>
        <div class="mascot-character-actions">
          <button id="mAll" type="button">全員</button>
          <button id="mClear" type="button">クリア</button>
        </div>
      </div>
      <div class="mascot-character-grid">
        ${Object.entries(C).map(([id,v])=>`
          <label class="mascot-character-chip">
            <input type="checkbox" value="${id}" data-char>
            <span>${v[0]}</span>
          </label>
        `).join('')}
      </div>
      <p id="mStatus" class="mascot-selection-status"></p>
    </section>
    <div class="mascot-setting-grid">
      <label class="mascot-switch"><span>動かす</span><input id="mMoving" type="checkbox"></label>
      <label class="mascot-switch"><span>セリフを表示</span><input id="mSpeech" type="checkbox"></label>
      <label><span>大きさ</span><select id="mSize"><option value="small">小</option><option value="medium">中</option><option value="large">大</option></select></label>
      <label><span>速度</span><select id="mSpeed"><option value="slow">ゆっくり</option><option value="normal">普通</option><option value="fast">速い</option></select></label>
      <label><span>ランダムライブ</span><select id="mLiveMode"><option value="off">OFF</option><option value="rare">少なめ（15〜25分）</option><option value="normal">普通（7〜12分）</option><option value="often">多め（3〜5分）</option></select></label>
      <button id="mLiveNow" type="button" class="mascot-live-test-btn">♪ 今すぐライブ</button>
    </div>
  </form>
`;status=dialog.querySelector('#mStatus');gear.addEventListener('click',()=>{sync();dialog.showModal?dialog.showModal():dialog.setAttribute('open','')});root.append(layer,lineupButton,gear,dialog);document.body.append(root);dialog.querySelector('#mLiveMode').onchange=e=>{S.liveMode=e.target.value;save();scheduleLive()};dialog.querySelector('#mLiveNow').onclick=()=>{if(!actors.some(a=>LIVE_ASSETS[a.id])){syncStatus('ライブ衣装があるキャラクター（歩夢・かすみ・しずく・果林・愛・彼方・せつ菜・エマ・璃奈・ミア・ランジュ・栞子）を選んでください');return}if(S.lineup||!S.moving){syncStatus('歩行モード・動かすONでライブを開始できます');return}dialog.close();void beginLive(true)};dialog.querySelector('#mMoving').onchange=e=>{S.moving=e.target.checked;if(!S.moving){endLive(performance.now());liveGeneration++;socialEvent=null;actors.forEach(a=>{a.restUntil=0;a.b.hidden=true})}nextSocialAt=performance.now()+2300;save()};dialog.querySelector('#mSpeech').onchange=e=>{S.speech=e.target.checked;save();visible()};dialog.querySelector('#mSize').onchange=async e=>{S.size=e.target.value;save();await rebuild();sync()};dialog.querySelector('#mSpeed').onchange=e=>{S.speed=e.target.value;actors.forEach(a=>setV(a));save()};dialog.querySelectorAll('[data-char]').forEach(x=>x.onchange=async()=>{let s=selected();S.selectedCharacters=s;save();await rebuild();sync()});dialog.querySelector('#mAll').onclick=async()=>{S.selectedCharacters=Object.keys(C);save();await rebuild();sync()};dialog.querySelector('#mClear').onclick=async()=>{S.selectedCharacters=[];save();await rebuild();sync()}}
window.lovePokeStartMascotLive=()=>beginLive(true);
async function init(){document.querySelectorAll('#'+ROOT).forEach(x=>x.remove());ui();sync();await rebuild();scheduleLive();document.addEventListener('visibilitychange',()=>{if(document.hidden)endLive(performance.now());else if(nextLiveAt<performance.now())scheduleLive()});addEventListener('resize',()=>{
 if(S.lineup){placeLineup();return}
 actors.forEach(a=>{let d=dims(a.id);a.w=d.w;a.h=d.h;let q=box(a);a.x=Math.min(q.r,Math.max(q.l,a.x));a.y=Math.min(q.b,Math.max(q.t,a.y))})
},{passive:true});requestAnimationFrame(tick)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();