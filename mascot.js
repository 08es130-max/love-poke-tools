(() => {
  'use strict';

  const ROOT_ID = 'lovePokeMascotRoot';
  const INSTANCE_KEY = '__lovePokeMascotInitialized';

  function removeDuplicateRoots() {
    const roots = [...document.querySelectorAll(`#${ROOT_ID}`)];
    roots.slice(1).forEach(root => root.remove());
    return roots[0] || null;
  }

  // 同じスクリプトが再実行されてもマスコットを増やさない
  if (window[INSTANCE_KEY]) {
    removeDuplicateRoots();
    return;
  }

  window[INSTANCE_KEY] = true;

  const SETTINGS_KEY = 'lovepoke_mascot_settings_v2';
  const CHARACTERS = Object.freeze({
    ayumu: { name: '上原歩夢', sprite: './assets/mascot/ayumu-sprite.png' },
    kasumi: { name: '中須かすみ', sprite: './assets/mascot/kasumi-sprite.png' },
    shizuku: { name: '桜坂しずく', sprite: './assets/mascot/shizuku-sprite.png' },
    karin: { name: '朝香果林', sprite: './assets/mascot/karin-sprite.png' },
    ai: { name: '宮下愛', sprite: './assets/mascot/ai-sprite.png' },
    kanata: { name: '近江彼方', sprite: './assets/mascot/kanata-sprite.png' },
    setsuna: { name: '優木せつ菜', sprite: './assets/mascot/setsuna-sprite.png' },
    emma: { name: 'エマ・ヴェルデ', sprite: './assets/mascot/emma-sprite.png' },
    rina: { name: '天王寺璃奈', sprite: './assets/mascot/rina-sprite.png' },
    shioriko: { name: '三船栞子', sprite: './assets/mascot/shioriko-sprite.png' },
    mia: { name: 'ミア・テイラー', sprite: './assets/mascot/mia-sprite.png' },
    lanzhu: { name: '鐘嵐珠', sprite: './assets/mascot/lanzhu-sprite.png' },
    yu: { name: '高咲侑', sprite: './assets/mascot/yu-sprite.png' }
  });

  const FALLBACK_CHARACTER = 'shioriko';
  const BASE_SPRITE_VERSION = '0.9.64';

  function currentCharacter() {
    return CHARACTERS[settings.character] || CHARACTERS[FALLBACK_CHARACTER];
  }

  function characterDisplayScale() {
    return ['ayumu', 'shioriko'].includes(settings.character) ? 1 : 1.18;
  }

  let spriteFrameWidth = 272;
  let spriteFrameHeight = 217;

  const SPRITE = Object.freeze({
    frameWidth: 272,
    frameHeight: 217,
    columns: 4,
    rows: 5,
    rowIndex: Object.freeze({
      right: 0,
      left: 1,
      down: 2,
      up: 3,
      idle: 4
    }),
    frames: Object.freeze({
      right: 4,
      left: 4,
      down: 4,
      up: 4,
      idle: 4
    }),
    walkFrameMs: 190,
    idleFrameMs: 520
  });

  const defaults = Object.freeze({
    enabled: true,
    character: FALLBACK_CHARACTER,
    moving: true,
    speech: true,
    size: 'medium',
    speed: 'normal'
  });

  const speeds = Object.freeze({
    slow: 24,
    normal: 42,
    fast: 68
  });

  const sizes = Object.freeze({
    small: 68,
    medium: 88,
    large: 112
  });

  const PHRASES = Object.freeze({
    ayumu: Object.freeze([
      '今日も一緒にがんばろうね！',
      'ちゃんと見てるからね',
      'えへへ、呼んだ？',
      '今日はどんな一日になるかな？',
      '無理しすぎちゃだめだよ',
      'あなたと一緒だと安心するな'
    ]),
    kasumi: Object.freeze([
      'かすみんを呼びましたね？',
      '今日もかすみんが一番かわいいです！',
      'ちゃんと応援してくださいねっ',
      'ほらほら、もっとかまってください！',
      'かすみんに任せれば完璧です！',
      'かわいいって言ってもいいんですよ？'
    ]),
    shizuku: Object.freeze([
      '今日も素敵な一日にしましょう',
      '何かお手伝いできることはありますか？',
      '少しだけ、休憩しませんか？',
      'ふふっ、見つけてくれたんですね',
      'その挑戦、応援しています',
      '一緒ならきっと大丈夫です'
    ]),
    karin: Object.freeze([
      'ふふ、私を呼んだの？',
      'そんなに見つめられると照れるわ',
      '焦らなくても大丈夫よ',
      'たまには肩の力を抜きなさい',
      '今日もあなたらしくいきましょう',
      '私がそばにいるから安心して'
    ]),
    ai: Object.freeze([
      'やっほー！愛さんだよ！',
      '今日も元気にいこー！',
      '困ったら愛さんにおまかせ！',
      '笑ってるほうが楽しいじゃん！',
      'いい感じじゃん、その調子！',
      '元気が足りない？じゃあ愛さん補給！'
    ]),
    kanata: Object.freeze([
      '彼方ちゃん、ここにいるよ〜',
      'ちょっとだけ休憩しよ〜？',
      'がんばりすぎはよくないよ〜',
      '眠くなったら一緒にお昼寝しよ〜',
      'ゆっくりでも進めば大丈夫だよ〜',
      '今日もえらい、えらい〜'
    ]),
    setsuna: Object.freeze([
      '今日も全力でいきましょう！',
      '大好きを貫きましょう！',
      'その情熱、とても素敵です！',
      '私も負けていられません！',
      '一緒に思いっきり楽しみましょう！',
      '全力で応援します！'
    ]),
    emma: Object.freeze([
      '今日もにこにこでいこうね',
      '疲れたら少し休もう？',
      'がんばってるの、ちゃんと見てるよ',
      '一緒にいるとあったかい気持ちになるね',
      '無理しないで、ゆっくりでいいよ',
      '今日もあなたにいいことがありますように'
    ]),
    rina: Object.freeze([
      '璃奈ちゃんボードなしでも伝わるかな',
      '見つけてくれて、うれしい',
      '今日も一緒にがんばろう',
      'ちょっとだけ、そばにいてもいい？',
      'あなたと話せると安心する',
      'うれしい。顔に出てると思う'
    ]),
    shioriko: Object.freeze([
      '今日もよろしくお願いします',
      '何かお手伝いしましょうか？',
      '無理はなさらないでくださいね',
      '焦らず、一つずつ進めましょう',
      'きちんと休息も取ってください',
      'あなたなら大丈夫だと思います'
    ]),
    mia: Object.freeze([
      'Hey、呼んだ？',
      'それくらいならボクに任せてよ',
      'まあ、悪くないんじゃない？',
      'ちゃんと集中してる？',
      '無理して効率落とすのはナシだよ',
      '終わったら少しくらい褒めてあげる'
    ]),
    lanzhu: Object.freeze([
      'ランジュに会いたかったの？',
      '当然、今日も最高に決まってるわ！',
      'もっと自信を持ちなさい！',
      'ランジュが応援してあげる！',
      '遠慮なんてしなくていいのよ',
      'あなたも一緒に輝きましょう！'
    ]),
    yu: Object.freeze([
      '今日もみんなを応援しよう！',
      'ときめくこと、見つかった？',
      'その好きって気持ち、大事にしようね',
      '一緒に楽しいこと考えよう！',
      'がんばってる姿、ちゃんと見てるよ',
      '今日もいっぱいときめこう！'
    ])
  });

  function currentPhrases() {
    return PHRASES[settings.character] || [
      `${currentCharacter().name}です！`,
      '呼んだ？',
      '今日もよろしくね！',
      'タップしてくれてありがとう！'
    ];
  }

  function randomPhrase() {
    const list = currentPhrases();
    return list[Math.floor(Math.random() * list.length)];
  }

  let settings = loadSettings();

  let layer;
  let mascot;
  let bubble;
  let dialog;
  let preview;

  let x = 0;
  let y = 0;
  let direction = 'right';

  let lastTime = 0;
  let frame = 0;
  let lastFrameTime = 0;

  let pauseUntil = 0;
  let nextPauseAt =
    performance.now() + randomBetween(9000, 17000);

  let bubbleTimer;
  let imageReady = false;

  function loadSettings() {
    try {
      return {
        ...defaults,
        ...JSON.parse(
          localStorage.getItem(SETTINGS_KEY) || '{}'
        )
      };
    } catch (_) {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch (_) {
      // localStorageが利用できない場合は何もしない
    }
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function safeInsets() {
    const style =
      getComputedStyle(document.documentElement);

    const number = name =>
      Number.parseFloat(
        style.getPropertyValue(name)
      ) || 0;

    return {
      top: number('--mascot-safe-top'),
      right: number('--mascot-safe-right'),
      bottom: number('--mascot-safe-bottom'),
      left: number('--mascot-safe-left')
    };
  }

  function dimensions() {
    const height =
      (sizes[settings.size] || sizes.medium) *
      characterDisplayScale();

    const width =
      height *
      spriteFrameWidth /
      spriteFrameHeight;

    const inset = safeInsets();
    const edge = 5;

    return {
      width,
      height,
      minX: inset.left + edge,
      minY: inset.top + edge,
      maxX: Math.max(
        inset.left + edge,
        innerWidth -
          inset.right -
          width -
          edge
      ),
      maxY: Math.max(
        inset.top + edge,
        innerHeight -
          inset.bottom -
          height -
          edge
      )
    };
  }

  function clampPosition() {
    const box = dimensions();

    x = Math.min(
      box.maxX,
      Math.max(box.minX, x)
    );

    y = Math.min(
      box.maxY,
      Math.max(box.minY, y)
    );
  }

  function renderSprite(
    target,
    pose,
    frameNumber
  ) {
    if (!target) return;

    const row = SPRITE.rowIndex[pose];
    const count = SPRITE.frames[pose];

    const column = Math.max(
      0,
      Math.min(count - 1, frameNumber)
    );

    let scale =
      Number.parseFloat(
        target.style.getPropertyValue(
          '--mascot-scale'
        )
      );

    if (!Number.isFinite(scale) || scale <= 0) {
      scale =
        sizes.medium /
        spriteFrameHeight;
    }

    target.style.setProperty(
      '--mascot-image',
      `url("${currentCharacter().sprite}?v=${BASE_SPRITE_VERSION}")`
    );

    target.style.setProperty(
      '--mascot-column',
      column
    );

    target.style.setProperty(
      '--mascot-row',
      row
    );

    target.style.setProperty(
      '--mascot-sheet-width',
      `${
        spriteFrameWidth *
        SPRITE.columns *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-sheet-height',
      `${
        spriteFrameHeight *
        SPRITE.rows *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-frame-x',
      `${
        -spriteFrameWidth *
        column *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-frame-y',
      `${
        -spriteFrameHeight *
        row *
        scale
      }px`
    );
  }

  function paint() {
    if (!mascot) return;

    const box = dimensions();

    mascot.style.width =
      `${box.width}px`;

    mascot.style.height =
      `${box.height}px`;

    mascot.style.setProperty(
      '--mascot-scale',
      box.height /
        spriteFrameHeight
    );

    const paused = isPaused();
    const step = frame % 4;
    const bob = paused ? 0 : [0, -4, 0, -2][step] * characterDisplayScale();
    const sway = paused ? 0 : [0, 1.5, 0, -1.5][step] * characterDisplayScale();
    const swayX = (direction === 'up' || direction === 'down') ? sway : 0;

    mascot.style.transform =
      `translate3d(${x + swayX}px, ${y + bob}px, 0)`;

    renderSprite(
      mascot,
      isPaused() ? 'idle' : direction,
      frame
    );
  }

  function isPaused(
    now = performance.now()
  ) {
    return (
      !settings.moving ||
      now < pauseUntil
    );
  }

  function updateVisibility() {
    if (!layer) return;

    layer.hidden =
      !settings.enabled ||
      !imageReady;

    if (!settings.speech) {
      hideBubble();
    }
  }

  function startRandomPause(now) {
    if (
      !settings.moving ||
      now < nextPauseAt
    ) {
      return;
    }

    pauseUntil =
      now +
      randomBetween(1400, 3200);

    nextPauseAt =
      pauseUntil +
      randomBetween(8000, 16000);

    frame =
      Math.floor(
        Math.random() *
        SPRITE.frames.idle
      );
  }

  function move(distance) {
    const box = dimensions();

    if (direction === 'right') {
      x += distance;

      if (x >= box.maxX) {
        x = box.maxX;
        direction = 'down';
        frame = 0;
      }
    } else if (direction === 'down') {
      y += distance;

      if (y >= box.maxY) {
        y = box.maxY;
        direction = 'left';
        frame = 0;
      }
    } else if (direction === 'left') {
      x -= distance;

      if (x <= box.minX) {
        x = box.minX;
        direction = 'up';
        frame = 0;
      }
    } else {
      y -= distance;

      if (y <= box.minY) {
        y = box.minY;
        direction = 'right';
        frame = 0;
      }
    }
  }

  function animate(now) {
    const elapsed = Math.min(
      50,
      now - (lastTime || now)
    );

    lastTime = now;

    startRandomPause(now);

    if (
      settings.enabled &&
      imageReady
    ) {
      const paused =
        isPaused(now);

      if (!paused) {
        move(
          (
            speeds[settings.speed] ||
            speeds.normal
          ) *
            elapsed /
            1000
        );
      }

      const interval =
        paused
          ? SPRITE.idleFrameMs
          : SPRITE.walkFrameMs;

      if (
        now - lastFrameTime >=
        interval
      ) {
        const pose =
          paused
            ? 'idle'
            : direction;

        frame =
          (frame + 1) %
          SPRITE.frames[pose];

        lastFrameTime = now;
      }

      paint();
    }

    requestAnimationFrame(animate);
  }

  function hideBubble() {
    clearTimeout(bubbleTimer);

    if (bubble) {
      bubble.hidden = true;
    }
  }

  function showBubble(text) {
    if (
      !bubble ||
      !settings.speech ||
      !imageReady ||
      !settings.enabled
    ) {
      return;
    }

    const box = dimensions();

    bubble.textContent = text;
    bubble.hidden = false;

    bubble.style.left =
      `${
        Math.min(
          innerWidth - 170,
          Math.max(
            8,
            x +
              box.width / 2 -
              80
          )
        )
      }px`;

    bubble.style.top =
      `${
        Math.max(
          8,
          y - 58
        )
      }px`;

    clearTimeout(bubbleTimer);

    bubbleTimer =
      setTimeout(
        hideBubble,
        2800
      );
  }

  function applySettings() {
    saveSettings();
    clampPosition();
    updateVisibility();
    paint();
  }

  function syncDialog() {
    if (!dialog) return;

    dialog.querySelector(
      '#mascotCharacter'
    ).value =
      settings.character in CHARACTERS
        ? settings.character
        : FALLBACK_CHARACTER;

    dialog.querySelector(
      '#mascotEnabled'
    ).checked =
      settings.enabled;

    dialog.querySelector(
      '#mascotMoving'
    ).checked =
      settings.moving;

    dialog.querySelector(
      '#mascotSpeech'
    ).checked =
      settings.speech;

    dialog.querySelector(
      '#mascotSize'
    ).value =
      settings.size;

    dialog.querySelector(
      '#mascotSpeed'
    ).value =
      settings.speed;
  }

  function bindDialog() {
    const bind = (
      selector,
      key,
      value = element =>
        element.checked
    ) => {
      dialog
        .querySelector(selector)
        .addEventListener(
          'change',
          event => {
            settings[key] =
              value(
                event.currentTarget
              );

            applySettings();
            if (key === 'character') {
              imageReady = false;
              spriteFrameWidth = SPRITE.frameWidth;
              spriteFrameHeight = SPRITE.frameHeight;
              updateVisibility();
              loadSprite();
              mascot?.setAttribute(
                'aria-label',
                `${currentCharacter().name}マスコット。タップすると話します`
              );
            }
          }
        );
    };

    bind(
      '#mascotCharacter',
      'character',
      element => element.value
    );

    bind(
      '#mascotEnabled',
      'enabled'
    );

    bind(
      '#mascotMoving',
      'moving'
    );

    bind(
      '#mascotSpeech',
      'speech'
    );

    bind(
      '#mascotSize',
      'size',
      element => element.value
    );

    bind(
      '#mascotSpeed',
      'speed',
      element => element.value
    );

    dialog
      .querySelector(
        '#mascotTestSpeech'
      )
      .addEventListener(
        'click',
        () => {
          showBubble(randomPhrase());
        }
      );
  }

  function buildUi() {
    removeDuplicateRoots();

    const root =
      document.createElement('div');

    root.id = ROOT_ID;
    root.className = 'mascot-root';

    layer =
      document.createElement('div');

    layer.className =
      'mascot-layer';

    layer.setAttribute(
      'aria-live',
      'polite'
    );

    mascot =
      document.createElement('button');

    mascot.type = 'button';

    mascot.className =
      'edge-mascot mascot-sprite';

    mascot.setAttribute(
      'aria-label',
      `${currentCharacter().name}マスコット。タップすると話します`
    );

    mascot.addEventListener(
      'click',
      () => {
        mascot.classList.remove(
          'mascot-tapped'
        );

        void mascot.offsetWidth;

        mascot.classList.add(
          'mascot-tapped'
        );

        setTimeout(
          () =>
            mascot.classList.remove(
              'mascot-tapped'
            ),
          550
        );

        const now = performance.now();
        pauseUntil = Math.max(pauseUntil, now + 2600);
        direction = 'down';
        frame = 0;
        lastFrameTime = now;
        paint();
        showBubble(randomPhrase());
      }
    );

    bubble =
      document.createElement('div');

    bubble.className =
      'mascot-bubble';

    bubble.hidden = true;

    layer.append(
      mascot,
      bubble
    );

    const settingsButton =
      document.createElement('button');

    settingsButton.type =
      'button';

    settingsButton.className =
      'mascot-settings-btn';

    settingsButton.setAttribute(
      'aria-label',
      'マスコット設定を開く'
    );

    settingsButton.textContent =
      '⚙';

    dialog =
      document.createElement('dialog');

    dialog.className =
      'mascot-dialog';

    dialog.innerHTML = `
      <form method="dialog" class="mascot-dialog-card">
        <header class="mascot-dialog-head">
          <div>
            <h2>マスコット設定</h2>
            <p>好きな虹ヶ咲メンバーが画面の外周を歩きます。</p>
          </div>
          <button class="ghost-btn" value="close">閉じる</button>
        </header>

        <div class="mascot-preview" aria-label="マスコットのプレビュー">
          <span class="mascot-sprite"></span>
        </div>

        <div class="mascot-setting-grid">
          <label class="mascot-character-setting">
            <span>キャラクター</span>
            <select id="mascotCharacter">
              ${Object.entries(CHARACTERS).map(([id, character]) =>
                `<option value="${id}">${character.name}</option>`
              ).join('')}
            </select>
          </label>
          <label class="mascot-switch">
            <span>マスコットを表示</span>
            <input id="mascotEnabled" type="checkbox">
          </label>

          <label class="mascot-switch">
            <span>動かす</span>
            <input id="mascotMoving" type="checkbox">
          </label>

          <label class="mascot-switch">
            <span>セリフを表示</span>
            <input id="mascotSpeech" type="checkbox">
          </label>

          <label>
            <span>大きさ</span>
            <select id="mascotSize">
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </label>

          <label>
            <span>速度</span>
            <select id="mascotSpeed">
              <option value="slow">ゆっくり</option>
              <option value="normal">普通</option>
              <option value="fast">速い</option>
            </select>
          </label>
        </div>

        <div class="mascot-dialog-actions">
          <button
            id="mascotTestSpeech"
            type="button"
            class="primary-btn"
          >
            セリフを試す
          </button>
        </div>
      </form>
    `;

    preview =
      dialog.querySelector(
        '.mascot-preview .mascot-sprite'
      );

    if (preview) {
      preview.style.width = '100px';
      preview.style.height = '80px';

      preview.style.setProperty(
        '--mascot-scale',
        80 /
          spriteFrameHeight
      );

      renderSprite(
        preview,
        'down',
        0
      );
    }

    settingsButton.addEventListener(
      'click',
      () => {
        syncDialog();

        if (
          typeof dialog.showModal ===
          'function'
        ) {
          dialog.showModal();
        } else {
          dialog.setAttribute(
            'open',
            ''
          );
        }
      }
    );

    root.append(
      layer,
      settingsButton,
      dialog
    );

    document.body.append(root);

    bindDialog();
  }

  function loadSprite() {
    const image = new Image();
    const selected = currentCharacter();

    image.onload = () => {
      const frameWidth = image.naturalWidth / SPRITE.columns;
      const frameHeight = image.naturalHeight / SPRITE.rows;

      imageReady =
        Number.isFinite(frameWidth) &&
        Number.isFinite(frameHeight) &&
        frameWidth > 0 &&
        frameHeight > 0;

      if (imageReady) {
        spriteFrameWidth = frameWidth;
        spriteFrameHeight = frameHeight;
        clampPosition();
        paint();

        if (preview) {
          preview.style.setProperty(
            '--mascot-scale',
            80 / spriteFrameHeight
          );
          renderSprite(preview, 'down', 0);
        }
      }

      updateVisibility();

      dialog?.classList.toggle(
        'mascot-image-error',
        !imageReady
      );
    };

    image.onerror = () => {
      if (settings.character !== FALLBACK_CHARACTER) {
        settings.character = FALLBACK_CHARACTER;
        saveSettings();
        syncDialog();
        loadSprite();
        return;
      }

      imageReady = false;
      updateVisibility();
      dialog?.classList.add('mascot-image-error');
    };

    image.src = `${selected.sprite}?v=${BASE_SPRITE_VERSION}`;
  }

  function init() {
    const existing =
      removeDuplicateRoots();

    if (existing) {
      return;
    }

    buildUi();

    const box =
      dimensions();

    x = box.minX;
    y = box.maxY;

    clampPosition();
    paint();
    syncDialog();
    loadSprite();

    addEventListener(
      'resize',
      () => {
        clampPosition();
        paint();
        hideBubble();
      },
      { passive: true }
    );

    requestAnimationFrame(
      animate
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
