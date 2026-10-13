(function () {
  // The hero SVG is part of the page (placed there by tools/build_hero.py).
  // Its entrance is pure CSS; this script adds the pointer and click behaviour.
  var svg = document.querySelector('.hero__svg');
  if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---------- parallax ----------

  function parallax(svg) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var tx = 0, ty = 0, x = 0, y = 0, frame = 0;

    function tick() {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      svg.style.setProperty('--px', x.toFixed(4));
      svg.style.setProperty('--py', y.toFixed(4));
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    }
    function aim(nx, ny) {
      tx = nx; ty = ny;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      aim((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
    });
    document.documentElement.addEventListener('pointerleave', function () { aim(0, 0); });
  }

  // ---------- click boost ----------

  // A click on the visual speeds up the two travelling circles: a snappy ramp
  // up, a short hold at full speed, then an eased return to normal speed.
  // Each circle has its own top speed (the layer id maps to a multiplier).
  var BOOST = {
    rates: { 'circle-1': 10, 'circle-2': 5 },
    rampUp: 100,
    hold: 800,
    rampDown: 1200
  };

  function boost(svg) {
    var targets = [];
    Object.keys(BOOST.rates).forEach(function (id) {
      svg.querySelectorAll('#' + id + ' *').forEach(function (el) {
        el.getAnimations().forEach(function (a) {
          if (a.effect && a.effect.getTiming().iterations === Infinity) {
            targets.push({ anim: a, max: BOOST.rates[id] });
          }
        });
      });
    });
    if (!targets.length) return;
    svg.classList.add('is-clickable');

    // level runs from 0 (normal speed) to 1 (each circle at its top speed)
    var level = 0, frame = 0, clickedAt = 0, startLevel = 0, peak = 0;

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function tick(now) {
      var t = Math.max(now - clickedAt, 0);
      var finished = false;
      if (t < BOOST.rampUp) {
        level = peak = startLevel + (1 - startLevel) * ease(t / BOOST.rampUp);
      } else if (t < BOOST.rampUp + BOOST.hold) {
        level = peak = 1;
      } else {
        var down = Math.min((t - BOOST.rampUp - BOOST.hold) / BOOST.rampDown, 1);
        level = peak * (1 - ease(down));
        finished = down === 1;
      }
      targets.forEach(function (target) {
        target.anim.playbackRate = 1 + (target.max - 1) * level;
      });
      frame = finished ? 0 : requestAnimationFrame(tick);
    }

    svg.addEventListener('click', function () {
      clickedAt = performance.now();
      startLevel = level;
      if (!frame) frame = requestAnimationFrame(tick);
    });
  }

  parallax(svg);
  boost(svg);
})();
