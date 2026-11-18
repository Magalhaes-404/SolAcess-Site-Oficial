/*
 * Abertura do SolAcess com o giro de 360° do frasco.
 * - O frasco gira sozinho; arrastar para o lado (mouse ou dedo) gira para um lado ou para o outro.
 * - ROLAGEM ÚNICA: um único gesto (roda do mouse, deslizar o dedo, seta para baixo, Page Down, espaço)
 *   ou o botão "Entrar no site" toca a abertura inteira sozinha e leva direto ao conteúdo.
 *   Rolagens repetidas durante a animação (tremor, inércia do trackpad) são ignoradas.
 * - Com "Menos movimento" ligado, a abertura vira uma imagem estática e a página rola normalmente.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var hero = document.querySelector('.hero');
  var sticky = document.querySelector('.hero-sticky');
  var model = document.querySelector('.hero-model');
  var video = document.querySelector('.hero-video');
  var veil = document.querySelector('.hero-veil');
  var stages = [document.querySelector('.stage-1'), document.querySelector('.stage-2'), document.querySelector('.stage-3')];
  var dragHint = document.querySelector('.drag-hint');
  var enter = document.querySelector('.skip-intro');
  var intro = document.getElementById('inicio');
  var isSmall = window.matchMedia('(max-width: 700px)');
  if (!hero || !video) return;

  var broken = false;
  function on() { return root.classList.contains('has-3d'); }
  function fallback() { broken = true; root.classList.remove('has-3d'); root.classList.add('no-3d'); }
  function noop() {}
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function range(p, a, b) { return smooth((p - a) / (b - a)); }
  function now() { return window.performance ? performance.now() : Date.now(); }

  /* Tamanho do quadro do vídeo e ponto da abertura (topo da tampa ≈ 7,5% da altura) */
  var S = 0, H = 0, W = 0;
  var mobileCenter = 0; // no celular: centro do espaço livre entre o cabeçalho e o texto
  function resize() {
    if (!on()) return;
    W = sticky.clientWidth; H = sticky.clientHeight;
    if (isSmall.matches) {
      // O frasco ocupa o espaço entre o cabeçalho e o bloco de texto, sem cobrir o título.
      var header = document.querySelector('.site-header');
      var top = header ? header.offsetHeight : 70;
      var copyTop = stages[0].offsetTop;
      var free = Math.max(0, copyTop - top);
      // o frasco visível ocupa ~85% do quadro do vídeo (as bordas são esfumadas pela máscara)
      S = clamp(free / 0.85, H * 0.45, Math.min(H * 0.96, W * 1.5));
      mobileCenter = top + free / 2;
      sticky.style.setProperty('--copy-top', copyTop + 'px');
    } else {
      S = Math.min(H * 0.96, W * 1.1);
      sticky.style.removeProperty('--copy-top');
    }
    video.style.setProperty('--s', S + 'px');
    update(p || 0);
  }
  window.addEventListener('resize', resize);
  // o bloco de texto muda de altura com "Texto maior" ou quando a fonte termina de carregar
  if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(stages[0]);

  /* Camadas de texto, câmera e transição para um progresso p (0 → 1) */
  function windowOp(p, a, b, c, d) { return Math.min(range(p, a, b), 1 - range(p, c, d)); }
  function update(p) {
    var s1 = 1 - range(p, 0.04, 0.14);
    stages[0].style.opacity = s1;
    stages[0].style.transform = 'translateY(' + (-40 * (1 - s1)) + 'px)';
    var s2 = windowOp(p, 0.15, 0.22, 0.36, 0.43);
    stages[1].style.opacity = s2;
    stages[1].style.transform = (isSmall.matches ? '' : 'translateY(-50%) ') + 'translateX(' + (30 * (1 - s2)) + 'px)';
    var s3 = windowOp(p, 0.47, 0.53, 0.64, 0.7);
    stages[2].style.opacity = s3;
    stages[2].style.transform = 'scale(' + (0.96 + 0.04 * s3) + ')';
    dragHint.style.opacity = 0.8 * (1 - range(p, 0.02, 0.08));
    sticky.style.setProperty('--shade', (1 - range(p, 0.38, 0.46)).toFixed(3));

    // câmera: leve aproximação → centraliza a tampa → mergulha na abertura
    var center = range(p, 0.3, 0.62);
    var approach = 1 + 0.12 * range(p, 0.1, 0.4) + 1.4 * range(p, 0.45, 0.66);
    var dive = Math.pow(range(p, 0.66, 0.95), 2.2) * 26;
    var scale = approach + dive;
    var originY = (H - S) / 2 + 0.075 * S;            // posição na tela do topo da tampa
    var ty = (H / 2 - originY) * center;
    var tyMobile = isSmall.matches ? (mobileCenter - H / 2) * (1 - center) : 0; // no celular, frasco acima do texto
    video.style.transform = 'translate3d(0,' + (ty + tyMobile).toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';

    var v = range(p, 0.84, 0.975);
    veil.style.clipPath = 'circle(' + (v * 75).toFixed(2) + '% at 50% 50%)';
    veil.style.webkitClipPath = veil.style.clipPath;
    enter.style.opacity = 1 - range(p, 0.85, 0.92);
    enter.style.pointerEvents = p > 0.9 ? 'none' : '';
  }

  /* Linha do tempo da abertura: [segundos, progresso]. Os textos ficam parados o tempo de serem lidos. */
  var TIMELINE = [[0, 0], [0.4, 0.22], [1.5, 0.36], [1.9, 0.53], [2.4, 0.64], [3.2, 1]];
  function timeline(t) {
    for (var i = 1; i < TIMELINE.length; i++) {
      var a = TIMELINE[i - 1], b = TIMELINE[i];
      if (t <= b[0]) return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
    }
    return 1;
  }

  var state = 'idle';      // idle (parada no início) | playing (animação tocando)
  var p = 0, t0 = 0, last = 0, holdUntil = 0;

  function frame(ts) {
    if (state !== 'playing') return;
    var dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
    var target = timeline((now() - t0) / 1000);
    p += (target - p) * Math.min(1, dt * 7);          // suaviza as mudanças de velocidade
    if (target >= 1 && p > 0.985) p = 1;
    update(p);
    if (p >= 1) finish();
    else requestAnimationFrame(frame);
  }

  // rolagem instantânea (ignora o scroll-behavior: smooth do CSS)
  function jumpTo(y) {
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = prev;
  }
  function scrollPos() { return window.scrollY || window.pageYOffset || 0; }

  function play() {
    if (state !== 'idle' || !on()) return;
    state = 'playing'; t0 = now(); last = 0;
    // a página fica travada durante a animação (nenhum tipo de rolagem passa)
    root.classList.add('intro-playing', 'intro-lock');
    // se a página já estava um pouco rolada dentro da abertura, volta ao topo dela antes de animar
    if (scrollPos() > 0) jumpTo(0);
    enter.textContent = 'Pular animação';
    requestAnimationFrame(frame);
  }

  // "Pular animação": avança a linha do tempo até o fim (o mergulho final fica rápido)
  function skip() { if (state === 'playing' && now() - t0 > 800) t0 = now() - 1e5; }

  function reset() {
    state = 'idle'; p = 0; update(0);
    root.classList.remove('intro-playing', 'intro-lock');
    enter.textContent = 'Entrar no site';
  }

  function finish() {
    // A luz creme cobre a tela inteira: a troca para o conteúdo não aparece como um salto.
    root.classList.remove('intro-lock');
    jumpTo(intro ? intro.offsetTop : hero.offsetHeight);
    lastY = scrollPos();
    if (intro) { try { intro.focus({ preventScroll: true }); } catch (e) { intro.focus(); } }
    holdUntil = now() + 900;   // ignora o resto do gesto (inércia do trackpad, tremor)
    reset();
  }

  /* Gestos que entram no site: uma rolagem, um deslizar de dedo ou uma tecla */
  // "na abertura": qualquer posição antes do conteúdo começar
  function atTop() { return scrollPos() < (intro ? intro.offsetTop - 4 : hero.offsetHeight); }
  function inPanel(e) { return e.target && e.target.closest && e.target.closest('#menu, .a11y-panel, dialog'); }
  function holding() { return state === 'playing' || now() < holdUntil; }

  window.addEventListener('wheel', function (e) {
    if (!on() || inPanel(e)) return;
    if (holding()) { e.preventDefault(); return; }
    if (atTop() && e.deltaY > 0) { e.preventDefault(); play(); }
  }, { passive: false });

  var touchY = null, touchX = 0;
  window.addEventListener('touchstart', function (e) {
    touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    if (touchY !== null) touchX = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (!on() || inPanel(e)) return;
    if (holding()) { if (e.cancelable) e.preventDefault(); return; }
    if (touchY === null || dragging || !atTop()) return;
    var dy = touchY - e.touches[0].clientY, dx = Math.abs(touchX - e.touches[0].clientX);
    if (dy > 0 && dy >= dx) {                          // dedo subindo = rolar para baixo
      if (e.cancelable) e.preventDefault();
      if (dy > 6) { touchY = null; play(); }
    }
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (!on() || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k !== 'ArrowDown' && k !== 'PageDown' && k !== ' ' && k !== 'Spacebar') return;
    if (e.target.closest && e.target.closest('input, textarea, select, button, summary, [contenteditable], dialog, #menu, .a11y-panel')) return;
    if (holding()) { e.preventDefault(); return; }
    if (atTop() && !e.shiftKey) { e.preventDefault(); play(); }
  });

  // Rolagens que não chegam como "roda do mouse" — barra lateral, botão do meio, alguns mouses e touchpads,
  // teclado com foco em outro lugar — também disparam a entrada automática quando vão para baixo na abertura.
  var lastY = scrollPos();
  window.addEventListener('scroll', function () {
    var y = scrollPos(), down = y > lastY;
    lastY = y;
    if (!on()) return;
    if (state === 'playing') { if (y > 0) jumpTo(0); return; }   // segura a abertura no lugar durante a animação
    if (now() < holdUntil) return;
    if (down && y > 0 && atTop()) play();
  }, { passive: true });

  // Botão grande "Entrar no site" (sem precisar rolar). Durante a animação ele vira "Pular animação".
  // Sem a animação (Menos movimento), ele continua sendo um link comum para o conteúdo.
  enter.addEventListener('click', function (e) {
    if (!on()) return;
    e.preventDefault();
    if (state === 'idle') play(); else skip();
  });

  /* Arrastar para girar: só começa depois de um movimento claro para o lado (evita giros sem querer) */
  var down = false, dragging = false, sx = 0, sy = 0, lastX = 0, resumeTimer = 0;
  model.addEventListener('pointerdown', function (e) {
    if (state !== 'idle' || !video.duration) return;
    down = true; dragging = false; sx = lastX = e.clientX; sy = e.clientY;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    if (!dragging) {
      var mx = Math.abs(e.clientX - sx);
      if (mx > 10 && mx > Math.abs(e.clientY - sy)) {
        dragging = true; lastX = e.clientX;
        model.classList.add('grabbing'); video.pause(); clearTimeout(resumeTimer);
      }
      return;
    }
    var dx = e.clientX - lastX; lastX = e.clientX;
    var d = video.duration;
    var t = (video.currentTime - dx / W * d * 1.2) % d;   // uma volta ≈ largura da tela arrastada
    if (t < 0) t += d;
    video.currentTime = t;
  });
  function endDrag() {
    down = false;
    if (!dragging) return;
    dragging = false; model.classList.remove('grabbing');
    resumeTimer = setTimeout(function () { if (visible && on()) video.play().catch(noop); }, 1400);
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* O vídeo só toca com a abertura na tela */
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (!on()) return;
      if (visible) { if (!dragging) video.play().catch(noop); }
      else video.pause();
    }).observe(hero);
  }

  var source = video.querySelector('source');
  if (source) source.addEventListener('error', fallback);
  video.addEventListener('error', fallback);

  function start() {
    if (broken) { fallback(); return; }
    video.muted = true;
    resize();
    p = 0; update(0);
    root.classList.add('ready');
    if (visible) video.play().catch(noop);
  }
  function stop() {
    if (state === 'playing') reset();
    video.pause();
  }

  // O painel de acessibilidade liga/desliga o movimento sem recarregar a página.
  document.addEventListener('solacess:movimento', function () { if (on()) start(); else stop(); });

  if (on()) start();
})();
