(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (header && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!header.classList.contains("nav-open")) return;
      if (!header.contains(e.target)) {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reveal on scroll */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* Count-up numbers on the landing page */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (counters.length) {
    function animateCounter(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = target; return; }
      var start = null;
      var duration = 900;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    }
  }

  /* Story archive filtering */
  var search = document.querySelector("#story-search");
  var provSelect = document.querySelector("#story-prov");
  var countEl = document.querySelector("#story-count");
  var emptyEl = document.querySelector("#story-empty");
  var randomBtn = document.querySelector("#story-random");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".story-card"));

  if (search && provSelect && cards.length) {
    var provinces = [];
    cards.forEach(function (card) {
      var p = card.getAttribute("data-prov");
      if (p && provinces.indexOf(p) === -1) provinces.push(p);
    });
    provinces.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      provSelect.appendChild(opt);
    });

    function applyFilter() {
      var q = search.value.trim().toLowerCase();
      var prov = provSelect.value;
      var visible = 0;
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-text") || "").toLowerCase();
        var ok = (!q || text.indexOf(q) !== -1) && (prov === "all" || card.getAttribute("data-prov") === prov);
        card.hidden = !ok;
        if (ok) visible += 1;
      });
      document.querySelectorAll(".province-block").forEach(function (block) {
        var any = block.querySelector(".story-card:not([hidden])");
        block.hidden = !any;
      });
      if (countEl) countEl.innerHTML = "显示 <b>" + visible + "</b> / " + cards.length + " 段";
      if (emptyEl) emptyEl.classList.toggle("show", visible === 0);
    }

    var timer = null;
    search.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(applyFilter, 90);
    });
    provSelect.addEventListener("change", applyFilter);

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
        e.preventDefault();
        search.focus();
      }
    });

    if (randomBtn) {
      randomBtn.addEventListener("click", function () {
        var visibleCards = cards.filter(function (c) { return !c.hidden; });
        if (!visibleCards.length) return;
        var card = visibleCards[Math.floor(Math.random() * visibleCards.length)];
        card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        card.classList.add("flash");
        setTimeout(function () { card.classList.remove("flash"); }, 1800);
        try { history.replaceState(null, "", "#" + card.id); } catch (e) {}
      });
    }

    applyFilter();

    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target && target.classList.contains("story-card")) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: "auto", block: "center" });
          target.classList.add("flash");
          setTimeout(function () { target.classList.remove("flash"); }, 1800);
        }, 120);
      }
    }
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
