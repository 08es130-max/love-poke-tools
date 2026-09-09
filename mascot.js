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
  const SPRITE_URL = './assets/mascot/shioriko-sprite.png';

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
    walkFrameMs: 150,
    idleFrameMs: 520
  });

  const defaults = Object.freeze({
    enabled: true,
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

  const phrases = Object.freeze([
    '栞子が画面の端をうろちょろします',
    '角に来たら方向転換です',
    'ときどき立ち止まってしまいます',
    'タップありがとうございます'
  ]);

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
      sizes[settings.size] || sizes.medium;

    const width =
      height *
      SPRITE.frameWidth /
      SPRITE.frameHeight;

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
        SPRITE.frameHeight;
    }

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
        SPRITE.frameWidth *
        SPRITE.columns *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-sheet-height',
      `${
        SPRITE.frameHeight *
        SPRITE.rows *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-frame-x',
      `${
        -SPRITE.frameWidth *
        column *
        scale
      }px`
    );

    target.style.setProperty(
      '--mascot-frame-y',
      `${
        -SPRITE.frameHeight *
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
        SPRITE.frameHeight
    );

    mascot.style.transform =
      `translate3d(${x}px, ${y}px, 0)`;

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
          }
        );
    };

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
          showBubble(
            phrases[
              Math.floor(
                Math.random() *
                phrases.length
              )
            ]
          );
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
      '栞子マスコット。タップすると話します'
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

        showBubble(
          phrases[
            Math.floor(
              Math.random() *
              phrases.length
            )
          ]
        );
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
            <p>栞子が画面の外周を歩きます。</p>
          </div>
          <button class="ghost-btn" value="close">閉じる</button>
        </header>

        <div class="mascot-preview" aria-label="マスコットのプレビュー">
          <span class="mascot-sprite"></span>
        </div>

        <div class="mascot-setting-grid">
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
          SPRITE.frameHeight
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

    image.onload = () => {
      imageReady =
        image.naturalWidth ===
          SPRITE.frameWidth *
            SPRITE.columns &&
        image.naturalHeight ===
          SPRITE.frameHeight *
            SPRITE.rows;

      updateVisibility();

      dialog?.classList.toggle(
        'mascot-image-error',
        !imageReady
      );
    };

    image.onerror = () => {
      imageReady = false;

      updateVisibility();

      dialog?.classList.add(
        'mascot-image-error'
      );
    };

    image.src = SPRITE_URL;
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
