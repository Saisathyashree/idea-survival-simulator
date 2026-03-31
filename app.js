// ── Particle background ────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() { resize(); particles = Array.from({ length: 120 }, mkParticle); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,229,255,${p.alpha})`;
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,229,255,${0.04 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init(); draw();
})();

// ── DOM refs ───────────────────────────────────────────────────────────────
const analyzeBtn     = document.getElementById('analyzeBtn');
const ideaInput      = document.getElementById('ideaInput');
const industrySelect = document.getElementById('industrySelect');
const stageSelect    = document.getElementById('stageSelect');
const resultsEl      = document.getElementById('results');

analyzeBtn.addEventListener('click', runAnalysis);
ideaInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) runAnalysis(); });

// ── Signal maps ────────────────────────────────────────────────────────────
const POSITIVE_SIGNALS = [
  { pattern: /\b(ai|machine learning|ml|automation|automat)\b/i,   label: 'AI / Automation angle',      weight: 8 },
  { pattern: /\b(subscription|saas|recurring)\b/i,                  label: 'Recurring revenue model',     weight: 7 },
  { pattern: /\b(marketplace|platform|network effect)\b/i,          label: 'Platform / network effect',   weight: 7 },
  { pattern: /\b(mobile|app|ios|android)\b/i,                       label: 'Mobile-first approach',       weight: 5 },
  { pattern: /\b(niche|specific|target|segment)\b/i,                label: 'Targeted niche focus',        weight: 6 },
  { pattern: /\b(problem|pain|frustrat|inefficien)\b/i,             label: 'Solves a clear pain point',   weight: 9 },
  { pattern: /\b(data|analytics|insight|dashboard)\b/i,             label: 'Data-driven value',           weight: 6 },
  { pattern: /\b(health|wellness|mental|fitness)\b/i,               label: 'High-demand health sector',   weight: 6 },
  { pattern: /\b(save|saving|cheaper|affordable|cost)\b/i,          label: 'Cost-saving value prop',      weight: 7 },
  { pattern: /\b(personaliz|custom|tailor)\b/i,                     label: 'Personalization',             weight: 5 },
  { pattern: /\b(b2b|enterprise|business)\b/i,                      label: 'B2B monetization path',       weight: 7 },
  { pattern: /\b(api|integrat|plugin|extension)\b/i,                label: 'Ecosystem integration',       weight: 5 },
  { pattern: /\b(local|location|geo|near)\b/i,                      label: 'Location-aware utility',      weight: 5 },
  { pattern: /\b(community|connect|social)\b/i,                     label: 'Community-driven',            weight: 4 },
  { pattern: /\b(freemium|open.?source)\b/i,                        label: 'Low barrier to entry',        weight: 4 },
];

const NEGATIVE_SIGNALS = [
  { pattern: /\b(clone|copy|like (uber|airbnb|tinder|facebook|instagram) but)\b/i, label: 'Sounds like a clone',                weight: 10 },
  { pattern: /\b(everyone|all people|whole world|universal)\b/i,                    label: 'Target market too broad',            weight: 8  },
  { pattern: /\b(crypto|nft|blockchain|web3|token)\b/i,                             label: 'Volatile / saturated crypto space',  weight: 7  },
  { pattern: /\b(no competition|no one else|first ever|never been done)\b/i,        label: 'Unvalidated "no competition" claim', weight: 9  },
  { pattern: /\b(social media|another social|new social)\b/i,                       label: 'Crowded social media space',         weight: 8  },
  { pattern: /\b(free (forever|always)|no monetiz)\b/i,                             label: 'No clear monetization',             weight: 9  },
  { pattern: /\b(hardware|physical product|manufacture)\b/i,                        label: 'High capital hardware costs',        weight: 6  },
  { pattern: /\b(government|regulation|licens|compliance)\b/i,                      label: 'Heavy regulatory burden',           weight: 7  },
  { pattern: /\b(simple|easy|just|basic)\b/i,                                       label: 'May underestimate complexity',       weight: 3  },
];

const INDUSTRY_MOD = {
  tech:           { market: 10, competition: -8,  funding: 10 },
  health:         { market: 8,  competition: -5,  funding: 8  },
  food:           { market: 5,  competition: -10, funding: 3  },
  finance:        { market: 7,  competition: -9,  funding: 9  },
  education:      { market: 6,  competition: -6,  funding: 5  },
  retail:         { market: 4,  competition: -12, funding: 2  },
  social:         { market: 6,  competition: -14, funding: 6  },
  entertainment:  { market: 5,  competition: -7,  funding: 5  },
  sustainability: { market: 9,  competition: -4,  funding: 8  },
  other:          { market: 4,  competition: -5,  funding: 3  },
};

const STAGE_MOD = {
  concept:   { bonus: 0,  survival: 0  },
  validated: { bonus: 8,  survival: 10 },
  mvp:       { bonus: 15, survival: 18 },
  launched:  { bonus: 20, survival: 25 },
};

// ── Analysis engine ────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function analyzeIdea(text, industry, stage) {
  const ind = INDUSTRY_MOD[industry] || INDUSTRY_MOD.other;
  const stg = STAGE_MOD[stage];
  const positives = POSITIVE_SIGNALS.filter(s => s.pattern.test(text));
  const negatives = NEGATIVE_SIGNALS.filter(s => s.pattern.test(text));
  const pos = positives.reduce((a, s) => a + s.weight, 0);
  const neg = negatives.reduce((a, s) => a + s.weight, 0);

  const viability   = clamp(50 + pos * 2.5 - neg * 3   + ind.market      + stg.bonus,       5, 98);
  const competition = clamp(60 + ind.competition - (negatives.some(n => /clone|social|crypto/.test(n.label)) ? 15 : 0), 5, 95);
  const funding     = clamp(45 + ind.funding + pos * 1.5 - neg * 2        + stg.bonus * 0.5, 5, 95);
  const novelty     = clamp(55 + pos * 2    - neg * 2.5 + (text.length > 120 ? 5 : -5),      5, 95);
  const timing      = clamp(50 + ind.market * 0.8 + pos * 1.2 - neg * 1.5,                   5, 95);

  const survival = clamp(
    Math.round(viability * 0.3 + competition * 0.2 + funding * 0.18 + novelty * 0.2 + timing * 0.12 + stg.survival),
    5, 97
  );

  return {
    survival,
    scores: {
      viability:   Math.round(viability),
      competition: Math.round(competition),
      funding:     Math.round(funding),
      novelty:     Math.round(novelty),
      timing:      Math.round(timing),
    },
    positives,
    negatives,
  };
}

// ── Improvements ───────────────────────────────────────────────────────────
function buildImprovements(text, scores, industry, stage) {
  const tips = [];
  if (scores.viability < 55)
    tips.push({ title: 'Sharpen your value proposition', detail: 'One sentence: "We help [X] do [Y] by [Z]." If you can\'t write it, the idea needs more focus.' });
  if (scores.competition < 50)
    tips.push({ title: 'Carve out a defensible niche', detail: 'Name 3 competitors. Then name the one thing you do that none of them do. "Better" isn\'t a moat — specificity is.' });
  if (scores.funding < 50)
    tips.push({ title: 'Lock in a monetization model', detail: 'Choose one: subscription, transaction fee, freemium, licensing, or ads. Test willingness to pay before you build.' });
  if (scores.novelty < 55)
    tips.push({ title: 'Find your unfair advantage', detail: 'What do you know, have, or can do that others can\'t easily copy? Distribution, data, domain expertise, or community.' });
  if (scores.timing < 50)
    tips.push({ title: 'Validate market timing', detail: 'Is this a "why now" moment? Identify the trend, regulation, or tech shift that makes this the right time.' });
  if (stage === 'concept')
    tips.push({ title: 'Run a 5-person validation sprint', detail: 'Talk to 5 potential users this week. Ask about the problem, not your solution. Their exact words will reshape your pitch.' });
  if (stage === 'concept' || stage === 'validated')
    tips.push({ title: 'Ship a landing page before code', detail: 'A waitlist page tests real demand. Aim for 100 signups before writing a single line of product code.' });
  if (/everyone|all people|whole world/i.test(text))
    tips.push({ title: 'Narrow your beachhead market', detail: '"Dog owners in Austin aged 25–35" beats "pet lovers everywhere." Start tiny, dominate, then expand.' });
  if (industry === 'social' || industry === 'entertainment')
    tips.push({ title: 'Solve the cold-start problem first', detail: 'Social products die without early users. Seed a tight community (Discord, Reddit, school) before going broad.' });
  if (industry === 'finance')
    tips.push({ title: 'Map regulatory requirements on day one', detail: 'KYC, AML, and licensing can take 6–18 months. Know what applies before you write a line of code.' });
  if (tips.length < 3)
    tips.push({ title: 'Set a 90-day survival milestone', detail: 'One measurable goal: X users, $Y revenue, or Z customer interviews. Ambiguity is the silent killer of ideas.' });
  return tips.slice(0, 5);
}

// ── Verdict ────────────────────────────────────────────────────────────────
function getVerdict(s) {
  if (s >= 65) return { type: 'survive',  icon: '🚀', label: 'VIABLE',   title: 'This idea has legs.',      summary: `At ${s}% survival probability, the market signals are mostly green. The concept has real potential — execution is now the variable.` };
  if (s >= 40) return { type: 'struggle', icon: '⚡', label: 'RISKY',    title: 'Risky, but not dead.',     summary: `${s}% survival probability means meaningful headwinds. The idea could work with sharper focus and the right pivots.` };
  return              { type: 'fail',     icon: '💀', label: 'CRITICAL',  title: 'High risk of failure.',    summary: `${s}% survival probability is a red flag. Market signals are tough. Consider a significant pivot before investing more time.` };
}

// ── Radar chart ────────────────────────────────────────────────────────────
function drawRadar(canvas, scores) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R = Math.min(cx, cy) - 22;
  const keys = Object.keys(scores);
  const n = keys.length;
  const vals = keys.map(k => scores[k] / 100);
  const LABELS = ['Viability', 'Competition', 'Funding', 'Novelty', 'Timing'];

  function drawGrid() {
    [0.25, 0.5, 0.75, 1].forEach(t => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R * t, y = cy + Math.sin(a) * R * t;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1; ctx.stroke();
    });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1; ctx.stroke();
    }
  }

  let progress = 0;
  function frame() {
    progress = Math.min(progress + 0.04, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = R * vals[i] * ease;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,229,255,0.08)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();

    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = R * vals[i] * ease;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    }

    ctx.font = '600 9px Space Grotesk, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const lx = cx + Math.cos(a) * (R + 14), ly = cy + Math.sin(a) * (R + 14);
      ctx.fillText(LABELS[i], lx, ly + 4);
    }

    if (progress < 1) requestAnimationFrame(frame);
  }
  frame();
}

// ── Loading sequence ───────────────────────────────────────────────────────
const LOG_LINES = [
  { delay: 0,   type: 'ok',   text: 'Parsing idea vector...' },
  { delay: 160, type: 'ok',   text: 'Loading market signal database...' },
  { delay: 320, type: 'ok',   text: 'Running NLP pattern matching...' },
  { delay: 480, type: 'warn', text: 'Checking competitive landscape...' },
  { delay: 620, type: 'ok',   text: 'Calculating viability scores...' },
  { delay: 760, type: 'ok',   text: 'Generating improvement vectors...' },
  { delay: 880, type: 'ok',   text: 'Compiling survival probability...' },
];

function showLoading() {
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = `
    <div class="sim-loading">
      <div class="sim-log" id="simLog"></div>
      <div class="sim-progress-wrap">
        <div class="sim-progress-bar"><div class="sim-progress-fill" id="simFill"></div></div>
        <div class="sim-pct" id="simPct">0%</div>
      </div>
    </div>`;

  const log = document.getElementById('simLog');
  const fill = document.getElementById('simFill');
  const pct  = document.getElementById('simPct');
  const t0   = Date.now();

  LOG_LINES.forEach(l => {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'log-line';
      const ts = String(Math.floor((Date.now() - t0) / 10)).padStart(4, '0');
      line.innerHTML = `<span class="log-time">[${ts}ms]</span><span class="log-${l.type}">${l.type === 'ok' ? '✓' : '⚠'}</span><span>${l.text}</span>`;
      log.appendChild(line);
      requestAnimationFrame(() => line.classList.add('visible'));
    }, l.delay);
  });

  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(p + Math.random() * 8 + 2, 95);
    fill.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
    if (p >= 95) clearInterval(iv);
  }, 60);

  return () => { clearInterval(iv); fill.style.width = '100%'; pct.textContent = '100%'; };
}

// ── Render results ─────────────────────────────────────────────────────────
function scoreColor(v) {
  if (v >= 65) return '#00ff9d';
  if (v >= 40) return '#ff9500';
  return '#ff4d6d';
}

function renderResults(data, industry, stage, text) {
  const { survival, scores, positives, negatives } = data;
  const verdict = getVerdict(survival);
  const improvements = buildImprovements(text, scores, industry, stage);

  resultsEl.innerHTML = '';

  // Verdict + ring
  const circumference = 220;
  const offset = circumference - (survival / 100) * circumference;
  const vWrap = document.createElement('div');
  vWrap.className = `verdict-wrap ${verdict.type}`;
  vWrap.innerHTML = `
    <div class="verdict-top">
      <div style="flex:1">
        <div class="verdict-label">${verdict.label} — SIMULATION COMPLETE</div>
        <div class="verdict-title">${verdict.title}</div>
        <div class="verdict-summary">${verdict.summary}</div>
      </div>
      <div class="survival-ring-wrap">
        <div style="position:relative;width:100px;height:100px">
          <svg class="ring-svg" width="100" height="100" viewBox="0 0 100 100">
            <circle class="ring-track" cx="50" cy="50" r="35"/>
            <circle class="ring-fill" cx="50" cy="50" r="35"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" id="ringFill"/>
          </svg>
          <div class="ring-center">
            <div class="ring-pct" id="ringPct">0%</div>
            <div class="ring-sub">survival</div>
          </div>
        </div>
        <div class="ring-label">PROBABILITY</div>
      </div>
    </div>`;
  resultsEl.appendChild(vWrap);

  setTimeout(() => {
    document.getElementById('ringFill').style.strokeDashoffset = offset;
    let cur = 0;
    const step = () => {
      cur = Math.min(cur + Math.ceil(survival / 40), survival);
      document.getElementById('ringPct').textContent = cur + '%';
      if (cur < survival) requestAnimationFrame(step);
    };
    step();
  }, 80);

  // Radar
  const radarSec = document.createElement('div');
  radarSec.className = 'radar-section';
  const METRIC_META = [
    { key: 'viability',   label: 'Market Viability' },
    { key: 'competition', label: 'Competition Gap'   },
    { key: 'funding',     label: 'Fundability'       },
    { key: 'novelty',     label: 'Novelty'           },
    { key: 'timing',      label: 'Market Timing'     },
  ];
  radarSec.innerHTML = `
    <div class="radar-canvas-wrap">
      <canvas id="radarCanvas" width="200" height="200"></canvas>
    </div>
    <div class="radar-legend">
      ${METRIC_META.map(m => {
        const v = scores[m.key], c = scoreColor(v);
        return `<div class="radar-metric">
          <div class="radar-metric-top">
            <span class="radar-metric-name">${m.label}</span>
            <span class="radar-metric-val" style="color:${c}">${v}</span>
          </div>
          <div class="radar-bar"><div class="radar-bar-fill" style="background:${c}" data-w="${v}"></div></div>
        </div>`;
      }).join('')}
    </div>`;
  resultsEl.appendChild(radarSec);
  setTimeout(() => {
    drawRadar(document.getElementById('radarCanvas'), scores);
    radarSec.querySelectorAll('.radar-bar-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
  }, 80);

  // Signals
  const sigGrid = document.createElement('div');
  sigGrid.className = 'signals-grid';
  const strHTML = positives.length
    ? positives.map(p => `<div class="signal-item"><div class="signal-dot"></div><span>${p.label}</span></div>`).join('')
    : `<div class="signal-empty">No strong positive signals. Add more detail.</div>`;
  const riskHTML = negatives.length
    ? negatives.map(n => `<div class="signal-item"><div class="signal-dot"></div><span>${n.label}</span></div>`).join('')
    : `<div class="signal-empty">No major risk signals detected.</div>`;
  sigGrid.innerHTML = `
    <div class="signal-card strengths">
      <div class="signal-card-header">▲ Strengths detected</div>
      <div class="signal-list">${strHTML}</div>
    </div>
    <div class="signal-card risks">
      <div class="signal-card-header">▼ Risk signals</div>
      <div class="signal-list">${riskHTML}</div>
    </div>`;
  resultsEl.appendChild(sigGrid);

  // Improvements
  const impSec = document.createElement('div');
  impSec.className = 'improvements-section';
  impSec.innerHTML = `
    <div class="section-header">◈ Suggested Improvements</div>
    <div class="imp-list">
      ${improvements.map((imp, i) => `
        <div class="imp-item">
          <div class="imp-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="imp-body">
            <strong>${imp.title}</strong>
            <span>${imp.detail}</span>
          </div>
        </div>`).join('')}
    </div>`;
  resultsEl.appendChild(impSec);
}

// ── Main ───────────────────────────────────────────────────────────────────
function runAnalysis() {
  const text = ideaInput.value.trim();
  if (!text) {
    ideaInput.focus();
    ideaInput.style.borderColor = '#ff4d6d';
    ideaInput.style.boxShadow = '0 0 0 3px rgba(255,77,109,0.15)';
    setTimeout(() => { ideaInput.style.borderColor = ''; ideaInput.style.boxShadow = ''; }, 1400);
    return;
  }
  const industry = industrySelect.value;
  const stage    = stageSelect.value;
  const finishLoading = showLoading();

  setTimeout(() => {
    finishLoading();
    setTimeout(() => {
      const data = analyzeIdea(text, industry, stage);
      renderResults(data, industry, stage, text);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, 1100);
}
