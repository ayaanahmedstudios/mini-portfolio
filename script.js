document.addEventListener('DOMContentLoaded', () => {
    
    // --- Auto-Update Copyright Year ---
    document.querySelectorAll('.year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // --- Copy Email Logic ---
    document.querySelectorAll('.copy-email-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText('ayaanahmedstudios@gmail.com');
            const btnContent = btn.querySelector('.btn-content');
            btnContent.innerHTML = 'Email copied';
            btnContent.classList.add('copied-state');
            setTimeout(() => {
                btnContent.innerHTML = '<i class="ph ph-envelope-simple"></i>';
                btnContent.classList.remove('copied-state');
            }, 2000);
        });
    });

    // --- Search Bar Logic ---
    const searchInput = document.getElementById('project-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            // Works globally for Graphic Design (.project-item), Photo (.photo-card), and Video (.video-card)
            document.querySelectorAll('.project-item, .photo-card, .video-card').forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // --- Photography Lightbox Logic ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxMeta = document.getElementById('lightbox-meta');

    if (lightbox && lightboxImg && lightboxMeta) {
        document.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const imgSrc = card.querySelector('img').src;
                const metaContent = card.querySelector('.photo-overlay').innerHTML;
                lightboxImg.src = imgSrc;
                lightboxMeta.innerHTML = metaContent;
                lightbox.classList.add('active');
            });
        });

        lightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    // --- Canvas Morph Animation ---
    (async () => {
        const LOGO_SRC = "https://res.cloudinary.com/ayaanahmed/image/upload/v1769144180/ayaan-ahmed-logo_pqauyp.svg";
        const NAME   = "Ayaan Ahmed";
        const W      = 140;    
        const LOGO_W = 70;     
        const CELL   = 2;      
        const STEP   = 35;     
        const SPREAD = 180;    
        const MOVE   = 350;    
        const WAIT   = 5500;   
        const HOLD   = 3000;   

        const identity = document.getElementById("identity");
        if (!identity) return; // Failsafe for pages without the canvas
        
        const cv  = document.getElementById("cv");
        const ctx = cv.getContext("2d");
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
        const ease  = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

        const loadImg = cors => new Promise((res, rej) => {
          const i = new Image();
          if (cors) i.crossOrigin = "anonymous";
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = LOGO_SRC;
        });

        const fontReady = Promise.race([
          (document.fonts ? document.fonts.load('100px "Geist Pixel"', NAME) : Promise.resolve()).catch(() => {}),
          new Promise(r => setTimeout(r, 1500))
        ]);

        let img = null;
        try { img = await loadImg(true); } catch { try { img = await loadImg(false); } catch { img = null; } }
        await fontReady;

        const FONT = px => `400 ${px}px "Geist Pixel", ui-monospace, "SF Mono", Menlo, monospace`;
        const measure = document.createElement("canvas").getContext("2d");
        measure.font = FONT(100);
        const fs = Math.min(44, 100 * W / measure.measureText(NAME).width);

        const ratio = img && img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 0.2;
        const LH = LOGO_W * ratio;
        const H  = Math.ceil(Math.max(LH, fs * 1.3));

        const cd   = Math.max(1, Math.round(CELL * dpr));          
        const cols = Math.ceil(Math.round(W * dpr) / cd);
        const rows = Math.ceil(Math.round(H * dpr) / cd);
        const Wd = cols * cd, Hd = rows * cd;
        cv.width = Wd; cv.height = Hd;
        cv.style.width = (Wd / dpr) + "px"; cv.style.height = (Hd / dpr) + "px";

        const logoWd = LOGO_W * Wd / W, logoHd = logoWd * ratio, logoY = (Hd - logoHd) / 2;

        function drawText(c) {
          c.save();
          c.fillStyle = "#111111"; 
          c.font = FONT(fs * Wd / W);
          c.textBaseline = "middle";
          c.textAlign = "left";
          c.fillText(NAME, 0, Hd / 2 + fs * Wd / W * 0.03);
          c.restore();
        }
        
        function drawLogo(c) { 
            if (img) {
                c.save();
                c.filter = "invert(1)"; 
                c.drawImage(img, 0, logoY, logoWd, logoHd); 
                c.restore();
            }
        }

        function drawCrisp(mode) { ctx.clearRect(0, 0, Wd, Hd); ctx.imageSmoothingEnabled = true; mode ? drawLogo(ctx) : drawText(ctx); }

        drawCrisp(false);
        identity.classList.add("ready");
        const sr = document.createElement("span");
        sr.className = "sr"; sr.textContent = NAME; identity.appendChild(sr);

        if (!img) return;

        const sizes = [...new Set([Math.max(1, Math.round(cd / 3)), Math.max(1, Math.round(cd * 2 / 3)), cd])];
        const S = sizes.length;

        const off = document.createElement("canvas");
        off.width = Wd; off.height = Hd;
        const octx = off.getContext("2d", { willReadFrequently: true });

        function sampleCells(drawFn, s) {
          octx.clearRect(0, 0, Wd, Hd);
          drawFn(octx);
          const d = octx.getImageData(0, 0, Wd, Hd).data;          
          const gc = Math.ceil(Wd / s), gr = Math.ceil(Hd / s);
          const out = [];
          for (let gy = 0; gy < gr; gy++) {
            for (let gx = 0; gx < gc; gx++) {
              let sa = 0, sr_ = 0, sg = 0, sb = 0, n = 0;
              for (let y = gy * s; y < Math.min(Hd, gy * s + s); y++) {
                for (let x = gx * s; x < Math.min(Wd, gx * s + s); x++) {
                  const k = (y * Wd + x) * 4;
                  const a = d[k + 3];
                  sa += a; n++;
                  if (a > 0) { sr_ += d[k] * a; sg += d[k+1] * a; sb += d[k+2] * a; }
                }
              }
              if (n && sa / (255 * n) >= 0.4) {
                const r = Math.round(sr_ / sa), g = Math.round(sg / sa), b = Math.round(sb / sa);
                out.push({ x: gx, y: gy, color: `rgb(${r},${g},${b})` });
              }
            }
          }
          out.sort((p, q) => (Math.floor(p.x / 2) - Math.floor(q.x / 2)) || (p.y - q.y));
          return out;
        }

        let stages = null, pixelMode = true;
        try {
          stages = {
            text: sizes.map(s => sampleCells(drawText, s)),
            logo: sizes.map(s => sampleCells(drawLogo, s))
          };
          if (stages.text.some(l => !l.length) || stages.logo.some(l => !l.length)) pixelMode = false;
        } catch (e) { pixelMode = false; }

        const stageList = (mode, i) => (mode ? stages.logo : stages.text)[i];
        function paintList(list, s) {
          ctx.clearRect(0, 0, Wd, Hd);
          let last = "";
          for (const c of list) {
            if (c.color !== last) { ctx.fillStyle = c.color; last = c.color; }
            ctx.fillRect(c.x * s, c.y * s, s, s);
          }
        }

        let target = false;                       
        let phase = "rest", raf = 0;
        let pt = 0, stageK = 0, srcMode = false, exitMode = false, exitFrom = 0;
        let t0 = 0, totalMs = 0;

        let N, ax, ay, bx, by, cx, cy, fx, fy, tx, ty, delay;
        let acol, bcol, ccol, fcol, tcol;

        if (pixelMode) {
          const A = stageList(false, S - 1), B = stageList(true, S - 1);   
          N = Math.max(A.length, B.length);
          const F = () => new Float32Array(N);
          ax = F(); ay = F(); bx = F(); by = F(); cx = F(); cy = F();
          fx = F(); fy = F(); tx = F(); ty = F(); delay = F();
          acol = new Array(N); bcol = new Array(N); ccol = new Array(N); fcol = new Array(N); tcol = new Array(N);
          for (let i = 0; i < N; i++) {
            const a = A[Math.floor(i * A.length / N)];
            const b = B[Math.floor(i * B.length / N)];
            ax[i] = a.x; ay[i] = a.y; bx[i] = b.x; by[i] = b.y;
            acol[i] = a.color; bcol[i] = b.color;
          }
        }

        function setCells(mode) {
          for (let i = 0; i < N; i++) {
            cx[i] = mode ? bx[i] : ax[i];
            cy[i] = mode ? by[i] : ay[i];
            ccol[i] = mode ? bcol[i] : acol[i];
          }
        }

        function paintCells() {
          ctx.clearRect(0, 0, Wd, Hd);
          let last = "";
          for (let i = 0; i < N; i++) {
            if (ccol[i] !== last) { ctx.fillStyle = ccol[i]; last = ccol[i]; }
            ctx.fillRect(cx[i] * cd, cy[i] * cd, cd, cd);
          }
        }

        function startCells(toLogo, short) {
          fx.set(cx); fy.set(cy);
          for (let i = 0; i < N; i++) fcol[i] = ccol[i];
          tx.set(toLogo ? bx : ax); ty.set(toLogo ? by : ay);
          for (let i = 0; i < N; i++) tcol[i] = toLogo ? bcol[i] : acol[i];

          const amount = short ? 0.55 : 1;
          for (let i = 0; i < N; i++) {
            const xn = ax[i] / cols;
            const wave = toLogo ? xn : 1 - xn;     
            delay[i] = (wave * 0.82 + Math.random() * 0.18) * SPREAD * amount;
          }
          totalMs = SPREAD * amount + MOVE;
          phase = "move";
        }

        function frame(now) {
          if (phase === "enter") {
            const k = Math.max(0, Math.floor((now - pt) / STEP));
            if (k < S) { stageK = k; paintList(stageList(srcMode, k), sizes[k]); }
            else { setCells(srcMode); startCells(target, false); t0 = now; }
          }

          if (phase === "move") {
            const el = Math.max(0, now - t0);
            for (let i = 0; i < N; i++) {
              const p = clamp((el - delay[i]) / MOVE);
              const e = ease(p);
              cx[i] = Math.round(fx[i] + (tx[i] - fx[i]) * e);     
              cy[i] = Math.round(fy[i] + (ty[i] - fy[i]) * e);
              ccol[i] = p < 0.5 ? fcol[i] : tcol[i];
            }
            paintCells();
            if (el >= totalMs) { phase = "exit"; exitMode = target; exitFrom = S - 1; pt = now; }
          } else if (phase === "exit") {
            const k = Math.max(0, Math.floor((now - pt) / STEP));
            const idx = exitFrom - k;
            if (idx >= 0) paintList(stageList(exitMode, idx), sizes[idx]);
            else { phase = "rest"; drawCrisp(exitMode); return; }
          }
          raf = requestAnimationFrame(frame);
        }

        const LEVELS = [1, 2, 3, 4, 6, 8, 12];
        const small = document.createElement("canvas");
        const sctx = small.getContext("2d");
        let fbProg = 0, fbFrom = 0, fbTo = 0, fbT0 = 0, fbDur = 0, fbLast = -1, fbMoving = false;

        function pixelate(drawFn, b) {
          if (b <= 1) { drawFn(ctx); return; }
          small.width = Math.ceil(Wd / b); small.height = Math.ceil(Hd / b);
          sctx.clearRect(0, 0, small.width, small.height);
          sctx.save(); sctx.scale(1 / b, 1 / b); drawFn(sctx); sctx.restore();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(small, 0, 0, small.width * b, small.height * b);
        }
        
        function frameFallback(now) {
          const t = clamp((now - fbT0) / fbDur);
          fbProg = fbFrom + (fbTo - fbFrom) * t;
          const L = LEVELS.length - 1;
          const step = Math.round(fbProg * 2 * L);
          if (step !== fbLast) {
            fbLast = step;
            ctx.clearRect(0, 0, Wd, Hd);
            if (step <= L) pixelate(drawText, LEVELS[step] * cd / 3);
            else           pixelate(drawLogo, LEVELS[2 * L - step] * cd / 3);
          }
          if (t < 1) raf = requestAnimationFrame(frameFallback);
          else { fbMoving = false; drawCrisp(target); }
        }

        function setLogo(next) {
          if (next === target) return;
          const prev = target;
          target = next;
          cancelAnimationFrame(raf);

          if (reduce) { phase = "rest"; drawCrisp(target); return; }
          const now = performance.now();

          if (!pixelMode) {
            fbFrom = fbMoving ? fbProg : (next ? 0 : 1);
            fbTo = next ? 1 : 0;
            fbT0 = now; fbLast = -1; fbMoving = true;
            fbDur = 400 * Math.max(0.3, Math.abs(fbTo - fbFrom));
            raf = requestAnimationFrame(frameFallback);
            return;
          }

          if (phase === "rest") {
            srcMode = prev; phase = "enter"; pt = now; stageK = 0;
          } else if (phase === "enter") {
            phase = "exit"; exitMode = srcMode; exitFrom = Math.min(stageK, S - 1); pt = now;
          } else if (phase === "move") {
            startCells(next, true); t0 = now;       
          } else if (phase === "exit") {
            setCells(prev); startCells(next, false); t0 = now;
          }
          raf = requestAnimationFrame(frame);
        }

        let engaged = false, timer;
        function cycle() {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (!engaged) setLogo(true);
            timer = setTimeout(() => {
              if (!engaged) setLogo(false);
              cycle();
            }, HOLD);
          }, WAIT);
        }
        cycle();

        const engage    = () => { engaged = true;  clearTimeout(timer); setLogo(true);  };
        const disengage = () => { engaged = false; setLogo(false); cycle(); };
        
        identity.addEventListener("pointerenter", engage);
        identity.addEventListener("pointerleave", disengage);
        identity.addEventListener("touchstart", engage);
        identity.addEventListener("touchend", () => setTimeout(disengage, 1000));
    })();
});
