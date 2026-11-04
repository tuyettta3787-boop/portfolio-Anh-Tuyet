/* ==========================================================
   Nền 3D: sticker IT (máy tính, C++, router, chip, wifi, </>) bóng bẩy trôi lơ lửng
   - Dùng Three.js (js/vendor/three.min.js, đã có sẵn trong thư mục)
   - Hình trôi nhẹ, xoay chậm, nghiêng theo chuột, trượt theo độ cuộn
   - Đổi sắc theo nền đang xem (nền kem ↔ nền hồng)
   - Máy không có WebGL hoặc bật "giảm chuyển động": dùng nền dự phòng bằng CSS
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var canvas = document.getElementById("bg3d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!canvas || !window.THREE) { root.classList.add("no-webgl"); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (e) {
    root.classList.add("no-webgl");
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  /* ---------- Bảng màu (cùng hệ với website) ---------- */
  // [màu khi nền kem, màu khi nền hồng]
  var PALETTE = [
    [0xE9806A, 0xFFD9CC],   // đỏ cam phim
    [0x8FB5A0, 0x8FB5A0],   // xanh sage
    [0xF5EEDF, 0xE9806A],   // kem
    [0xB7D1C3, 0xDDEBE3]    // sage nhạt
  ];

  /* ---------- Cảnh, camera, ánh sáng ---------- */
  var scene = new THREE.Scene();
  var FOV = 35;
  var camera = new THREE.PerspectiveCamera(FOV, 1, 10, 6000);

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4d6657, 0.4));
  var keyLight = new THREE.DirectionalLight(0xffffff, 0.45);
  keyLight.position.set(-300, 500, 600);
  scene.add(keyLight);
  var rimLight = new THREE.DirectionalLight(0xffd9e6, 0.2);
  rimLight.position.set(500, -300, 300);
  scene.add(rimLight);
  var glow = new THREE.PointLight(0xffffff, 0.18, 0, 2);
  scene.add(glow);

/* ---------- Hình dạng (dựng một lần, dùng chung) ---------- */
  var puffy = function (depth, thick, size) {
    return { depth: depth, bevelEnabled: true, bevelThickness: thick, bevelSize: size,
             bevelOffset: 0, bevelSegments: 10, curveSegments: 28 };
  };

  // Thẻ code "</>" gồm ba nét phồng ghép thành một khối
  function polyShape(pts, dx) {
    var s = new THREE.Shape();
    pts.forEach(function (q, i) { if (i) s.lineTo(q[0] + dx, q[1]); else s.moveTo(q[0] + dx, q[1]); });
    s.closePath();
    return s;
  }
  function makeCode() {
    var lt = [[62, 90], [-8, 0], [62, -90], [30, -90], [-40, 0], [30, 90]];
    var gt = lt.map(function (q) { return [-q[0], q[1]]; }).reverse();
    var sl = [[-16, -95], [16, -95], [46, 95], [14, 95]];
    var g = new THREE.ExtrudeGeometry([polyShape(lt, -105), polyShape(sl, 0), polyShape(gt, 105)], puffy(26, 18, 9));
    g.center(); g.scale(0.0052, 0.0052, 0.0052);
    return g;
  }

  // Con trỏ chuột (mũi tên) phồng
  function makeCursor() {
    var s = new THREE.Shape();
    s.moveTo(-50, 100); s.lineTo(-50, -85); s.lineTo(-8, -48);
    s.lineTo(22, -112); s.lineTo(52, -98); s.lineTo(22, -36); s.lineTo(78, -36); s.lineTo(-50, 100);
    var g = new THREE.ExtrudeGeometry(s, puffy(20, 16, 9));
    g.center(); g.scale(0.0058, 0.0058, 0.0058);
    return g;
  }

  /* ---------- Sticker 3D chủ đề IT: máy tính, C++, router, chip, wifi ---------- */
  var TAU = Math.PI * 2;
  // đường viền chữ nhật bo góc (dùng cho Shape hoặc Path)
  function rr(p, x, y, w, h, r) {
    var x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
    p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1); p.lineTo(x0 + r, y1);
    p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
    return p;
  }
  function box(x, y, w, h, r) { return rr(new THREE.Shape(), x, y, w, h, r); }
  function disc(x, y, r) { var s = new THREE.Shape(); s.absarc(x, y, r, 0, TAU, false); return s; }
  function holeDisc(sh, x, y, r) { var h = new THREE.Path(); h.absarc(x, y, r, 0, TAU, true); sh.holes.push(h); }
  function holeBox(sh, x, y, w, h, r) { sh.holes.push(rr(new THREE.Path(), x, y, w, h, r)); }
  // cung tròn dày (dùng cho chữ C và sóng wifi)
  function arc(cx, cy, R, r, a0, a1) {
    var s = new THREE.Shape();
    s.absarc(cx, cy, R, a0, a1, false);
    s.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    s.absarc(cx, cy, r, a1, a0, true);
    s.closePath();
    return s;
  }
  function finish(shapes, k, depth, thick, size) {
    var g = new THREE.ExtrudeGeometry(shapes, puffy(depth, thick, size));
    g.center(); g.scale(k, k, k);
    return g;
  }

  // Máy tính để bàn: khung màn hình, chân đế và vài dòng code trên màn hình
  function makeMonitor() {
    var frame = box(0, 25, 240, 170, 22);
    holeBox(frame, 0, 25, 196, 126, 10);
    return finish([frame, box(0, -82, 36, 52, 4), box(0, -112, 120, 18, 9),
      box(-38, 52, 70, 12, 6), box(-18, 28, 104, 12, 6), box(-42, 4, 52, 12, 6)], 0.0048, 22, 10, 5);
  }

  // Chữ "C++"
  function makeCpp() {
    var plus = function (x, y) { return [box(x, y, 78, 24, 5), box(x, y, 24, 78, 5)]; };
    var shapes = [arc(-135, 0, 88, 48, 0.62, TAU - 0.62)].concat(plus(30, 16), plus(135, 16));
    return finish(shapes, 0.0034, 24, 12, 6);
  }

  // Bộ định tuyến (router) có hai ăng-ten và đèn báo
  function makeRouter() {
    var body = box(0, -55, 270, 84, 24);
    [-85, -50, -15].forEach(function (x) { holeDisc(body, x, -55, 9); });
    holeBox(body, 70, -55, 76, 12, 6);
    var ant = function (m) {
      return polyShapeRaw([[m * 99, -20], [m * 81, -20], [m * 111, 112], [m * 129, 112]]);
    };
    return finish([body, ant(1), ant(-1), disc(-120, 118, 15), disc(120, 118, 15)], 0.0044, 22, 10, 5);
  }
  function polyShapeRaw(pts) {
    var s = new THREE.Shape();
    pts.forEach(function (q, i) { if (i) s.lineTo(q[0], q[1]); else s.moveTo(q[0], q[1]); });
    s.closePath();
    return s;
  }

  // Chip vi xử lý (CPU) có chân cắm
  function makeChip() {
    var body = box(0, 0, 172, 172, 26);
    holeBox(body, 0, 0, 112, 112, 14);
    var sh = [body, box(0, 0, 62, 62, 10)];
    [-50, 0, 50].forEach(function (v) {
      sh.push(box(v, 102, 18, 46, 5), box(v, -102, 18, 46, 5), box(102, v, 46, 18, 5), box(-102, v, 46, 18, 5));
    });
    return finish(sh, 0.0046, 22, 10, 5);
  }

  // Biểu tượng wifi / mạng
  function makeWifi() {
    var cy = -70, sh = [disc(0, cy, 22)];
    [[52, 78], [98, 124], [144, 170]].forEach(function (rr_) {
      sh.push(arc(0, cy, rr_[1], rr_[0], Math.PI * 0.25, Math.PI * 0.75));
    });
    return finish(sh, 0.0045, 24, 10, 5);
  }

  // Chữ "UTH" khối phồng
  function makeUth() {
    var T = 30, shapes = [];
    // U
    var u = new THREE.Shape();
    u.moveTo(-190, 60); u.lineTo(-190, -20);
    u.absarc(-142, -20, 48, Math.PI, TAU, false);
    u.lineTo(-94, 60); u.lineTo(-124, 60); u.lineTo(-124, -20);
    u.absarc(-142, -20, 18, 0, Math.PI, true);
    u.lineTo(-160, 60); u.closePath();
    shapes.push(u);
    // T
    shapes.push(box(0, 45, 100, T, 6), box(0, -10, T, 120, 6));
    // H
    shapes.push(box(78, 0, T, 120, 6), box(172, 0, T, 120, 6), box(125, 0, 70, T - 6, 6));
    return finish(shapes, 0.0036, 26, 12, 6);
  }

  var GEOMS = {
    monitor: makeMonitor(),
    cpp: makeCpp(),
    router: makeRouter(),
    code: makeCode(),
    chip: makeChip(),
    wifi: makeWifi(),
    uth: makeUth(),
    cursor: makeCursor()
  };
  var TYPES = ["monitor", "cpp", "cursor", "uth", "router", "chip", "wifi", "code"];

  /* ---------- Tạo các vật thể ---------- */
  var MAX = 22;
  var items = [];

  // Bộ số ngẫu nhiên cố định: mỗi lần tải trang bố cục giống nhau
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = rng(2026);

  for (var i = 0; i < MAX; i++) {
    var type = TYPES[i % TYPES.length];
    var pal = PALETTE[i % PALETTE.length];
    var mat = new THREE.MeshPhysicalMaterial({
      color: pal[0], roughness: 0.28, metalness: 0,
      clearcoat: 0.6, clearcoatRoughness: 0.2
    });
    var mesh = new THREE.Mesh(GEOMS[type], mat);

    var holder = new THREE.Group();   // nhóm để xoay mà không mất hướng ban đầu
    holder.add(mesh);
    scene.add(holder);

    items.push({
      holder: holder, mesh: mesh, mat: mat, type: type,
      colA: new THREE.Color(pal[0]), colB: new THREE.Color(pal[1]),
      side: i % 2 === 0 ? -1 : 1,
      fx: 0.86 + rand() * 0.1,          // vị trí ngang (tỉ lệ nửa màn hình)
      jy: (rand() - 0.5) * 0.5,        // lệch dọc
      z: -220 + rand() * 280,          // độ sâu
      size: 80 + rand() * 70,          // cỡ (px) tại mặt phẳng z = 0
      spin: new THREE.Vector3((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.3),
      phase: rand() * Math.PI * 2,
      amp: 10 + rand() * 16,
      x: 0, y: 0, count: 0
    });
  }

  // Hai hình đầu tiên đặt tay ở chỗ trống của Hero: một ở góc trên bên phải, một ở bên trái phía dưới
items[0].side = 1;  items[0].fx = 0.7; items[0].size = 125;
items[1].side = -1; items[1].fx = 0.915; items[1].size = 80;
items[2].side = -1; items[2].fx = 1; items[2].size = 96;    // router cạnh tiêu đề Giới thiệu: dịch sát mép trái để không che chữ

/* ---------- Bố cục theo kích thước trang ---------- */
  var W = 0, H = 0, docH = 0, active = 0;

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    docH = Math.max(document.documentElement.scrollHeight, H);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.position.z = (H / 2) / Math.tan((FOV * Math.PI / 180) / 2);
    camera.updateProjectionMatrix();

    var small = W < 720;
    active = Math.min(MAX, Math.max(8, Math.round(docH / (small ? 520 : 300))));

    items.forEach(function (it, i) {
      var on = i < active;
      it.holder.visible = on;
      if (!on) return;
      var rest = active - 2, from = H * 1.2, span = docH - from;
      var pageY = i === 0 ? H * 0.24
                : i === 1 ? H * 0.76
                : from + (i - 2 + 0.5) * (span / Math.max(rest, 1)) + it.jy * (span / Math.max(rest, 1));
      var half = W / 2;
      // Trên điện thoại đẩy hình ra sát mép để không che chữ
      var fx = small ? 0.62 + it.fx * 0.3 : it.fx;
      it.x = it.side * half * Math.min(fx, 0.95);
      it.y = -pageY;
      var s = it.size * (small ? 0.62 : 1);
      it.holder.scale.setScalar(s);
    });
  }

  /* ---------- Chuột + cuộn mượt ---------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var sy = window.scrollY;
  var bgMix = 0; // 0 = nền kem, 1 = nền hồng

  window.addEventListener("pointermove", function (e) {
    mouse.tx = (e.clientX / W - 0.5) * 2;
    mouse.ty = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { layout(); drawFrame(0); }, 120);
  });
  // Trang đổi chiều cao khi ảnh/phần mới được thêm vào
  if ("ResizeObserver" in window) {
    var lastH = 0;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) > 40) { lastH = h; layout(); }
    }).observe(document.body);
  }

  /* ---------- Vẽ một khung hình ---------- */
  var tmp = new THREE.Color();

  function drawFrame(t) {
    // làm mượt cuộn, chuột
    sy += (window.scrollY - sy) * (reduceMotion ? 1 : 0.09);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    var wantPink = document.body.dataset.bg === "pink" ? 1 : 0;
    bgMix += (wantPink - bgMix) * 0.06;

    camera.position.x = mouse.x * 45;
    camera.position.y = -(sy + H / 2) - mouse.y * 30;
    glow.position.set(camera.position.x, camera.position.y + 120, 500);

    for (var i = 0; i < active; i++) {
      var it = items[i];
      var float = reduceMotion ? 0 : Math.sin(t * 0.0009 + it.phase) * it.amp;
      it.holder.position.set(it.x, it.y + float, it.z);

      var k = reduceMotion ? 0 : t * 0.001;
      // góc nghiêng bị giới hạn (không quá ~50°) để sticker không bao giờ xoay nghiêng thành lát mỏng
      it.holder.rotation.set(
        Math.sin(k * 0.9 + it.phase) * 0.3 + Math.sin(sy * 0.001 + it.phase) * 0.22 + mouse.y * 0.2,
        Math.sin(k * 0.7 + it.phase * 2) * 0.4 + Math.sin(sy * 0.0012 + it.phase) * 0.3 + mouse.x * 0.3,
        Math.sin(k * 0.5 + it.phase) * 0.2
      );

      tmp.copy(it.colA).lerp(it.colB, bgMix);
      it.mat.color.copy(tmp);
    }
    renderer.clear();
    renderer.render(scene, camera);    // các sticker 3D nổi phía trên nền mùa hè
  }

  /* ---------- Vòng lặp ---------- */
  layout();
  drawFrame(0);
  root.classList.add("bg3d-ready");

  if (reduceMotion) {
    // Không chuyển động: chỉ vẽ lại khi cuộn
    var wait = false;
    window.addEventListener("scroll", function () {
      if (wait) return; wait = true;
      requestAnimationFrame(function () { wait = false; drawFrame(0); });
    }, { passive: true });
  } else {
    (function loop(t) {
      if (!document.hidden) drawFrame(t);
      requestAnimationFrame(loop);
    })(0);
  }
})();
