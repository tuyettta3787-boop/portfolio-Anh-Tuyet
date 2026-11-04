/* =====================================================================
   PORTFOLIO – CUỐN ALBUM ẢNH & PHIM  ·  Trần Thị Ánh Tuyết
   Các phần:
   1. Mở bìa album        6. Lọc dự án + cửa sổ chi tiết
   2. Hiệu ứng khi cuộn    7. Thanh đo kỹ năng
   3. Menu tab + đếm khung 8. Đĩa than (sở thích)
   4. Thanh tiến độ        9. Form liên hệ (kiểm tra từng ô)
   5. Mở/đóng học vấn
   ===================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mở bìa album ---------- */
  var cover = $("#cover"), coverBtn = $("#coverBtn"), book = $("#book");
  function openCover() {
    if (!cover || cover.classList.contains("open")) return;
    cover.classList.add("open");
    setTimeout(function () { document.body.classList.remove("lock"); cover.setAttribute("hidden", ""); cover.style.display = "none"; }, reduce ? 0 : 1300);
    if (reduce) { document.body.classList.remove("lock"); cover.style.display = "none"; }
  }
  if (cover) {
    if (location.hash && location.hash.length > 1) {      // vào thẳng một mục thì bỏ qua bìa
      cover.style.display = "none";
    } else {
      document.body.classList.add("lock");
      coverBtn.addEventListener("click", openCover);
      book.addEventListener("click", openCover);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") openCover(); });
      coverBtn.focus({ preventScroll: true });
    }
  }

  /* ---------- 2. Hiệu ứng khi cuộn ("rửa ảnh" + trượt lên) ---------- */
  var revealEls = $$(".reveal, .photo");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- 3. Menu tab + bộ đếm khung hình ---------- */
  var pages = $$(".page");
  var tabLinks = $$("#tabs a, #barNav a");
  var frameNo = $("#frameNo");
  var current = -1;
  function setActive() {
    var mid = window.innerHeight * 0.4, idx = 0;
    pages.forEach(function (p, i) { if (p.getBoundingClientRect().top <= mid) idx = i; });
    if (idx === current) return;
    current = idx;
    var id = pages[idx].id;
    tabLinks.forEach(function (a) {
      var href = a.getAttribute("href").slice(1);
      var on = href === id || (href === "chung-chi" && id === "showcase");
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    frameNo.textContent = String(idx + 1).padStart(2, "0");
  }

  /* ---------- 4. Thanh tiến độ ---------- */
  var bar = $("#progress");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
      setActive();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- 5. Mở/đóng chi tiết học vấn ---------- */
  $$(".edu-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var more = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      more.classList.toggle("open", !open);
    });
  });

  /* ---------- 6. Lọc dự án + cửa sổ chi tiết ---------- */
  var chips = $$(".chip"), slides = $$(".slide"), fCount = $("#fCount");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.f, n = 0;
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on)); });
      slides.forEach(function (s) {
        var show = f === "all" || s.dataset.type === f;
        s.hidden = !show;
        if (show) n++;
      });
      fCount.textContent = n + " khung hình";
    });
  });

  var pd = $("#pd"), pdBody = $("#pdBody"), pdPanel = $("#pdPanel"), lastFocus = null;
  function openProject(slide) {
    var tpl = $(".pd-tpl", slide);
    if (!tpl) return;
    lastFocus = document.activeElement;
    pdBody.innerHTML = "";
    pdBody.appendChild(tpl.content.cloneNode(true));
    pd.hidden = false;
    document.body.classList.add("lock");
    pdPanel.scrollTop = 0;
    pdPanel.focus();
  }
  function closeProject() {
    pd.hidden = true;
    document.body.classList.remove("lock");
    if (lastFocus) lastFocus.focus();
  }
  slides.forEach(function (s) {
    s.addEventListener("click", function () { openProject(s); });
    s.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProject(s); }
    });
  });
  $("#pdBack").addEventListener("click", closeProject);
  pd.addEventListener("click", function (e) { if (e.target === pd) closeProject(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !pd.hidden) closeProject();
    if (e.key === "Tab" && !pd.hidden) {                 // giữ phím Tab trong cửa sổ
      var f = $$("a[href], button", pdPanel);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === pdPanel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- 7. Thanh đo kỹ năng: đổ đầy + đếm số ---------- */
  var rows = $$(".m-row");
  rows.forEach(function (r, i) { r.style.setProperty("--i", i); });
  function fillRow(row) {
    row.classList.add("go");
    var val = $(".m-val", row), to = +val.dataset.to;
    if (reduce) { val.textContent = to + "%"; return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 1200, 1);
      val.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + "%";
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, rows.indexOf(row) * 90);
  }
  if ("IntersectionObserver" in window) {
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { fillRow(en.target); mo.unobserve(en.target); } });
    }, { threshold: 0.4 });
    rows.forEach(function (r) { mo.observe(r); });
  } else { rows.forEach(fillRow); }

  /* ---------- 8. Đĩa than quay (chỉ là hiệu ứng, không phát nhạc) ---------- */
  var play = $("#muPlay");
  if (play) play.addEventListener("click", function () {
    var on = play.getAttribute("aria-pressed") !== "true";
    play.setAttribute("aria-pressed", String(on));
    play.setAttribute("aria-label", on ? "Dừng hiệu ứng đĩa than quay" : "Bật hiệu ứng đĩa than quay");
    $(".hb-music").classList.toggle("playing", on);
  });

  /* ---------- 9. Liên hệ: kiểm tra từng ô rồi mở ứng dụng email ---------- */
  var f = document.getElementById("ctForm");
  if (f) {
    var err = document.getElementById("ctErr"), ok = document.getElementById("ctOk");
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var rules = {
      name: function (v) { return v ? "" : "Bạn nhớ nhập họ tên nhé."; },
      email: function (v) { return !v ? "Bạn nhớ nhập email nhé." : (re.test(v) ? "" : "Email chưa đúng định dạng (vd: ten@gmail.com)."); },
      msg: function (v) { return v.length >= 5 ? "" : "Lời nhắn cần ít nhất 5 ký tự."; }
    };
    var check = function (k) {
      var el = f.elements[k], box = document.getElementById("err-" + k);
      var m = rules[k](el.value.trim());
      box.textContent = m; box.hidden = !m;
      el.setAttribute("aria-invalid", m ? "true" : "false");
      return !m;
    };
    Object.keys(rules).forEach(function (k) {
      f.elements[k].addEventListener("input", function () { if (f.elements[k].getAttribute("aria-invalid") === "true") check(k); });
      f.elements[k].addEventListener("blur", function () { if (f.elements[k].value) check(k); });
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      ok.hidden = true;
      var bad = Object.keys(rules).filter(function (k) { return !check(k); });
      err.hidden = !bad.length;
      if (bad.length) { f.elements[bad[0]].focus(); return; }
      var n = f.name.value.trim(), m = f.email.value.trim(), t = f.msg.value.trim();
      ok.hidden = false;
      window.location.href = "mailto:tranthianhtuyet350@gmail.com?subject=" + encodeURIComponent("Liên hệ từ Portfolio – " + n) + "&body=" + encodeURIComponent(t + "\n\n— " + n + " (" + m + ")");
      f.reset();
      Object.keys(rules).forEach(function (k) { f.elements[k].removeAttribute("aria-invalid"); });
    });
  }
})();
