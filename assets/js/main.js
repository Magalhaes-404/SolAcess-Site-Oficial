(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = root.classList.contains('reduce-motion');
  var A_DEFINIR = 'A definir';
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Menu móvel ---------- */
  var toggle = $('.nav-toggle');
  var toggleLabel = $('.sr-only', toggle);
  var menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Fechar menu' : 'Abrir menu';
    if (open) setPanel(false);
  }
  function closeMenu() { setMenu(false); }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });

  /* ---------- Painel de acessibilidade: texto maior e menos movimento ---------- */
  var a11yBtn = $('.a11y-toggle');
  var panel = $('#a11y-panel');
  function setPanel(open) {
    panel.hidden = !open;
    a11yBtn.setAttribute('aria-expanded', String(open));
    if (open) { closeMenu(); var first = $('.a11y-opt', panel); if (first) first.focus(); }
  }
  a11yBtn.addEventListener('click', function () { setPanel(panel.hidden); });
  $('.a11y-done', panel).addEventListener('click', function () { setPanel(false); a11yBtn.focus(); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) { setPanel(false); a11yBtn.focus(); }
    closeMenu();
  });
  // tocar fora do menu ou do painel também fecha
  document.addEventListener('click', function (e) {
    if (menu.classList.contains('open') && !e.target.closest('.site-header nav')) closeMenu();
    if (!panel.hidden && !e.target.closest('.a11y')) setPanel(false);
  });

  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  var opts = $$('.a11y-opt', panel);
  function syncOpts() {
    opts.forEach(function (sw) {
      var cls = sw.getAttribute('data-pref') === 'texto' ? 'texto-grande' : 'reduce-motion';
      sw.setAttribute('aria-checked', String(root.classList.contains(cls)));
    });
  }
  opts.forEach(function (sw) {
    sw.addEventListener('click', function () {
      if (sw.getAttribute('data-pref') === 'texto') {
        var big = root.classList.toggle('texto-grande');
        save('solacess-texto', big ? 'grande' : 'normal');
      } else {
        var calm = !root.classList.contains('reduce-motion');
        setMotion(calm);
        save('solacess-movimento', calm ? 'reduzido' : 'normal');
      }
      syncOpts();
    });
  });
  syncOpts();

  function setMotion(calm) {
    reduceMotion = calm;
    root.classList.toggle('reduce-motion', calm);
    root.classList.toggle('no-3d', calm);
    root.classList.toggle('has-3d', !calm);
    // vídeos: param de tocar sozinhos (o botão de cada vídeo continua funcionando)
    videos.forEach(function (v) {
      v.userPaused = calm;
      if (calm) v.pause();
      else {
        var r = v.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) v.play().catch(function () {});
      }
    });
    if (calm) $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    document.dispatchEvent(new CustomEvent('solacess:movimento', { detail: { reduzido: calm } }));
    onScroll();
  }

  /* ---------- Cabeçalho com fundo depois da abertura ---------- */
  var header = $('.site-header');
  var intro = $('#inicio');
  function onScroll() {
    var limit = root.classList.contains('no-3d') ? 40 : intro.offsetTop - 80;
    header.classList.toggle('solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Ficha técnica ---------- */
  var list = $('#spec-list');
  (window.SOLACESS_SPECS || []).forEach(function (s) {
    var item = document.createElement('div');
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = s.rotulo;
    if (s.valor) {
      dd.textContent = s.valor;
      if (s.status) { var st = document.createElement('span'); st.className = 'spec-status'; st.textContent = s.status; dd.appendChild(st); }
    } else { dd.textContent = 'Em definição'; dd.className = 'pending'; }
    item.appendChild(dt); item.appendChild(dd); list.appendChild(item);
  });
  var prox = window.SOLACESS_PROXIMAS || [];
  if (prox.length) {
    var card = document.createElement('div');
    card.className = 'spec-next';
    var t = document.createElement('dt');
    t.textContent = 'Próximas etapas';
    var d = document.createElement('dd');
    var proxTexto = document.createElement('p');
    proxTexto.textContent = 'Definidos depois dos testes de eficácia e segurança, com uma empresa especializada:';
    var ul = document.createElement('ul');
    prox.forEach(function (txt) { var li = document.createElement('li'); li.textContent = txt; ul.appendChild(li); });
    d.appendChild(proxTexto); d.appendChild(ul);
    card.appendChild(t); card.appendChild(d); list.appendChild(card);
  }

  /* ---------- Loja ---------- */
  var loja = window.SOLACESS_LOJA || { produtos: {}, contato: {} };
  var aberta = !!loja.vendasAbertas;
  var dialog = $('#buy-dialog');

  $$('.offer').forEach(function (card) {
    var id = card.getAttribute('data-produto');
    var p = (loja.produtos || {})[id] || {};
    var price = $('[data-preco]', card);
    if (p.preco) { price.textContent = p.preco; }
    else { price.innerHTML = '<span class="price-todo">Preço a definir</span>'; }

    var btn = $('[data-comprar]', card);
    btn.setAttribute('aria-describedby', 'loja-status');
    if (aberta && p.checkoutUrl) {
      btn.href = p.checkoutUrl;
      btn.target = '_blank'; btn.rel = 'noopener';
    } else {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openNotice(p.nome || $('h3', card).textContent, btn);
      });
    }
  });
  if (aberta) {
    $('#loja-status').textContent = 'Escolha sua opção e finalize a compra na loja oficial.';
  }

  var lastTrigger = null;
  function openNotice(nome, trigger) {
    lastTrigger = trigger;
    $('[data-escolha]', dialog).textContent = nome;
    var link = $('[data-aviso-link]', dialog);
    if (loja.avisoUrl) { link.href = loja.avisoUrl; link.target = '_blank'; link.rel = 'noopener'; }
    else { link.href = '#contato'; link.removeAttribute('target'); }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { window.alert('Vendas ainda não abertas: o SolAcess está em desenvolvimento.'); }
  }
  if (dialog) {
    $('[data-aviso-link]', dialog).addEventListener('click', function () { if (!loja.avisoUrl) dialog.close(); });
    dialog.addEventListener('close', function () { if (lastTrigger) lastTrigger.focus(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  $$('[data-loja]').forEach(function (dd) {
    var v = loja[dd.getAttribute('data-loja')];
    if (v) dd.textContent = v;
    else { dd.textContent = A_DEFINIR; dd.className = 'pending'; }
  });

  /* ---------- Contatos ---------- */
  var c = loja.contato || {};
  function formatPhone(n) {
    var d = String(n).replace(/\D/g, '');
    var m = d.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
    return m ? '+' + m[1] + ' (' + m[2] + ') ' + m[3] + '-' + m[4] : '+' + d;
  }
  var canais = [
    { nome: 'E-mail', valor: c.email, href: c.email && 'mailto:' + c.email, texto: c.email },
    { nome: 'WhatsApp', valor: c.whatsapp, href: c.whatsapp && 'https://wa.me/' + String(c.whatsapp).replace(/\D/g, ''), texto: c.whatsapp && formatPhone(c.whatsapp) },
    { nome: 'Instagram', valor: c.instagram, href: c.instagram && 'https://instagram.com/' + String(c.instagram).replace(/^@/, ''), texto: c.instagram && '@' + String(c.instagram).replace(/^@/, '') }
  ];
  var cl = $('#contact-list');
  canais.forEach(function (k) {
    var li = document.createElement('li');
    var label = document.createElement('span'); label.className = 'c-label'; label.textContent = k.nome;
    li.appendChild(label);
    if (k.valor) {
      var a = document.createElement('a'); a.href = k.href; a.textContent = k.texto;
      if (k.href.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
      li.appendChild(a);
    } else {
      var s = document.createElement('span'); s.className = 'pending'; s.textContent = A_DEFINIR; li.appendChild(s);
    }
    cl.appendChild(li);
  });

  /* ---------- Vídeos: sem som, em loop, só quando visíveis ----------
     Sem botões de pausa: quem preferir vídeos parados liga "Menos movimento" no painel de acessibilidade. */
  var videos = $$('.auto-video');
  videos.forEach(function (v) {
    var card = v.closest('.video-card');
    v.muted = true;
    v.userPaused = reduceMotion;
    function broken() { card.classList.add('broken'); card.style.backgroundImage = 'url("' + v.getAttribute('poster') + '")'; }
    var source = $('source', v);
    if (source) source.addEventListener('error', broken);
    v.addEventListener('error', broken);
  });

  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !v.userPaused) v.play().catch(function () {});
        else if (!en.isIntersecting && !v.paused) v.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { vio.observe(v); });

    if (!reduceMotion) {
      var targets = $$('.section-head, .intro-grid > *, .pillars li, .produto-grid > *, .publico > *, .anat-figure, .anat-list li, .dif-grid li, .gal-grid li, .mat, .refil > *, .ing-list li, .band-copy .wrap, .inc-grid > *, .offer, .tec-figure, .spec-list > div, .faq-list details, .contato-box > *, .footer-top');
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      targets.forEach(function (el, i) {
        el.classList.add('reveal');
        el.style.transitionDelay = (i % 4) * 70 + 'ms';
        rio.observe(el);
      });
    }
  } else if (!reduceMotion) {
    videos.forEach(function (v) { v.play().catch(function () {}); });
  }

  /* Links para o início levam o foco para o conteúdo (o botão da abertura é tratado no hero.js) */
  $$('a[href="#inicio"]:not(.skip-intro)').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(function () { intro.focus({ preventScroll: true }); }, 50); });
  });
})();
