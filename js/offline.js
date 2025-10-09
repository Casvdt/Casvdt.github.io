// Offline pagina uitbreidingen (NL):
// - Eenvoudige typewriter-animatie voor tekst
// - Mini-game met bugs vangen inclusief levels, power-ups en score

// Typewriter animatie: typt regels tekst één voor één
(function(){
  const el = document.querySelector('.typewriter');
  if (!el) return;
  const lines = [
    'Cas van der Toorn',
    'Stack: HTML • CSS • JS • Node • PHP • SQL',
    'Mode: OFFLINE (ASCII)'
  ];
  let i = 0, j = 0;
  function tick(){
    // Als alle regels klaar zijn, opnieuw beginnen
    if (i >= lines.length) { el.innerHTML += '\n'; i = 0; j = 0; }
    const line = lines[i];
    // Bouw de huidige weergave op met een knipperende cursor
    el.innerHTML = lines.slice(0, i).join('\n') + (i? '\n':'') + line.slice(0, j) + '<span class="cursor"> \u00a0</span>';
    j++;
    // Kleine pauze aan het einde van een regel
    if (j > line.length) { i++; j = 0; setTimeout(tick, 700); }
    else { setTimeout(tick, 40); }
  }
  tick();
})();

// Mini-game: Vang de bugs voordat je deployt
(function(){
  const board = document.querySelector('.board');
  const startBtn = document.querySelector('.start');
  const stopBtn = document.querySelector('.stop');
  const scoreEl = document.querySelector('.score');
  const timeEl = document.querySelector('.time');
  const bugCountEl = document.querySelector('.bug-count');
  const resultEl = document.querySelector('.result');
  const linesEl = document.querySelector('.lines');
  const levelEl = document.querySelector('.level');
  if (!board || !startBtn) return;

  // Spelstatus
  let running = false,
      score = 0,
      linesSaved = 0,
      time = 30,
      level = 1,
      spawnTimer = null,
      tickInt = null,
      levelInt = null,
      globalSlowUntil = 0,
      shieldUntil = 0;

  // Bepaalt of een tijdelijke vertraging (React power-up) actief is
  function currentSpeedMultiplier() {
    return Date.now() < globalSlowUntil ? 0.6 : 1.0; // slow when React power-up active
  }

  // Maakt een nieuwe bug die naar beneden valt
  function spawnBug(){
    const bug = document.createElement('div');
    bug.className = 'bug';
    bug.textContent = Math.random() < 0.5 ? '🐞' : '🪲';
    const startX = Math.random() * Math.max(10, (board.clientWidth - 28)) + 6;
    bug.style.left = startX + 'px';
    bug.style.top = '-24px';

    // Base speed in px/s, scales a bit with level but stays playable
    const base = 60 + Math.random() * 60; // 60-120 px/s
    const speedPerSec = base * (0.95 + level * 0.05); // gentle ramp per level

    let y = -24;
    let last = performance.now();
    const move = (now)=>{
      if (!running) return;
      const dt = Math.min(50, now - last); // begrens frame-delta voor stabiliteit
      last = now;
      const mult = currentSpeedMultiplier();
      y += (speedPerSec * mult) * (dt / 1000); // positie op basis van tijd i.p.v. frames
      bug.style.top = y + 'px';
      if (y > board.clientHeight) {
        // Als schild actief is: gemiste bug telt als gefixt
        if (Date.now() < shieldUntil) {
          awardFix(bug, true);
        }
        bug.remove();
        updateBugs(-1);
        return;
      }
      bug._raf = requestAnimationFrame(move);
    };
    // Klikken op een bug telt als fix
    bug.addEventListener('click',()=> awardFix(bug, false));
    updateBugs(1);
    board.appendChild(bug);
    bug._raf = requestAnimationFrame(move);
  }

  // Laat af en toe een power-up vallen: ⚛️ = slow, 🟩 = schild
  function spawnPowerUp(){
    // Low chance power-up
    if (!running) return;
    const roll = Math.random();
    if (roll > 0.35) return; // ~35% chance when called

    const pu = document.createElement('div');
    pu.className = 'bug';
    const isReact = Math.random() < 0.5;
    pu.textContent = isReact ? '⚛️' : '🟩';
    pu.style.left = (Math.random() * Math.max(10, (board.clientWidth - 28)) + 6) + 'px';
    pu.style.top = '-24px';

    const speedPerSec = 70; // langzamere val voor power-ups
    let y = -24;
    let last = performance.now();
    const fall = (now) => {
      if (!running) return;
      const dt = Math.min(50, now - last); last = now; // zelfde delta-begrenzing
      y += speedPerSec * (dt / 1000);
      pu.style.top = y + 'px';
      if (y > board.clientHeight) { pu.remove(); return; }
      pu._raf = requestAnimationFrame(fall);
    };
    pu.addEventListener('click', ()=>{
      if (isReact) {
        // React: vertraag bugs voor 5s
        globalSlowUntil = Date.now() + 5000;
      } else {
        // Node: schild voor 5s (volgende gemiste bug wordt gefixt)
        shieldUntil = Date.now() + 5000;
      }
      pu.remove();
    });
    board.appendChild(pu);
    pu._raf = requestAnimationFrame(fall);
  }

  function updateBugs(delta){
    if (!bugCountEl) { console.warn('[offline] #bug-count ontbreekt'); return; }
    bugCountEl.textContent = Math.max(0, (parseInt(bugCountEl.textContent)||0) + delta);
  }

  // Verwerk een bug-fix en tel 'lines saved' op
  function awardFix(bugEl, fromShield){
    score++; if (scoreEl) scoreEl.textContent = String(score);
    const gained = 90 + Math.floor(Math.random() * 61); // 90-150 lines
    linesSaved += gained;
    if (linesEl) linesEl.textContent = String(linesSaved);
    bugEl.remove();
    updateBugs(-1);
    // Small chance to spawn a power-up upon fix
    if (!fromShield && Math.random() < 0.15) spawnPowerUp();
  }

  // Start het spel en plan spawns + level-ups
  function start(){
    if (running) return; running = true;
    score = 0; linesSaved = 0; level = 1; time = 30;
    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = String(time); else console.warn('[offline] #time ontbreekt');
    if (linesEl) linesEl.textContent = '0';
    if (levelEl) levelEl.textContent = '1';
    if (resultEl) resultEl.textContent = '';
    Array.from(board.querySelectorAll('.bug')).forEach(b=>{ cancelAnimationFrame(b._raf); b.remove(); });
    if (bugCountEl) bugCountEl.textContent = '0';
    scheduleSpawns(900); // begin met relatief rustig tempo
    tickInt = setInterval(()=>{
      time--; if (timeEl) timeEl.textContent = String(time); // aftellen
      if (time <= 0) end();
    }, 1000);
    // Level up every 8s: increase level and make spawns faster
    levelInt = setInterval(()=>{
      level++; if (levelEl) levelEl.textContent = String(level);
      const newRate = Math.max(350, 900 - level * 80); // minimale interval begrensd
      scheduleSpawns(newRate);
      // Occasional power-up drop
      if (Math.random() < 0.7) spawnPowerUp();
    }, 8000);
  }

  // Stop het spel en toon eindresultaat
  function end(){
    running = false;
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    clearInterval(tickInt); clearInterval(levelInt);
    Array.from(board.querySelectorAll('.bug')).forEach(b=>{ cancelAnimationFrame(b._raf); b.remove(); });
    if (bugCountEl) bugCountEl.textContent = '0';
    const msg = score >= 10
      ? `✅ Ready to deploy! Great job catching bugs. Lines of code saved: ${linesSaved}.`
      : `🛠️ A few bugs slipped through. Lines of code saved: ${linesSaved}. Try again!`;
    if (resultEl) resultEl.innerHTML = '<span class="' + (score>=10?'success':'') + '\">' + msg + '</span>';
  }

  startBtn.addEventListener('click', start);
  if (stopBtn) stopBtn.addEventListener('click', ()=>{ if (running) end(); });

  // Plan periodieke spawns; bij hogere levels soms een extra bug tegelijk
  function scheduleSpawns(rateMs){
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(()=>{
      // Multiple spawns at higher levels occasionally
      spawnBug();
      if (level >= 3 && Math.random() < 0.25) spawnBug();
    }, rateMs);
  }
})();

// Offline Chatbot met humor
(function(){
  const log = document.querySelector('.chat-log');
  const input = document.querySelector('.chat-input');
  const sendBtn = document.querySelector('.chat-send');
  if (!log || !input || !sendBtn) return;

  // Lokale "dataset" met quotes/grappen en easter eggs
  const quotes = [
    '“Code is like humor. When you have to explain it, it’s bad.” – Cory House',
    '“It works on my machine.” – Iedereen ooit',
    '“First, solve the problem. Then, write the code.” – John Johnson',
    '“Premature optimization is the root of all evil.” – Donald Knuth',
    '“Talk is cheap. Show me the code.” – Linus Torvalds',
    '“Simplicity is the soul of efficiency.” – Austin Freeman',
    '“Any fool can write code that a computer can understand. Good programmers write code that humans can understand.” – Martin Fowler',
    '“Make it work, make it right, make it fast.” – Kent Beck',
    '“Programs must be written for people to read.” – Harold Abelson',
    '“The only way to go fast, is to go well.” – Robert C. Martin'
  ];
  const jokes = [
    'Waarom was de JavaScript developer verdrietig? Omdat hij Node hoe Express hij zich voelde.',
    'Ik heb 99 problemen, maar een semicolon is er geen; of juist wel? ;)',
    'There are only 10 types of people: those who understand binary and those who don’t.',
    'CSS is geweldig: één regel en je layout is kapot in 12 verschillende browsers.',
    'Bug free? Dan heb je vast je code nog niet gedraaid.',
    'Git commit -m "final fix" — drie commits later…',
    'Ik schrijf geen bugs, ik creëer onbedoelde features.'
  ];
  const eggs = {
    // Meta
    help: 'Typ: "grap", "quote", "ascii" of een onderwerp zoals: let/const, arrow, map, filter, reduce, fetch, promise, async, json, dom, event, regex, storage, module, css, flex, grid, responsive, media, var, box, git, npm, node, react.',
    ascii: '┌( ಠ‿ಠ)┘  └(ಠ‿ಠ )┐  Dance mode: ASCII enabled! Try: "grap" of "quote"',

    // JavaScript basics
    var: 'CSS/JS variabelen? In JS gebruik je meestal let (veranderbaar) of const (niet her-toewijzen).',
    let: 'let = variabele die je later kunt aanpassen. Blok-scope: alleen zichtbaar binnen {}.',
    const: 'const = naam blijft aan dezelfde waarde/collectie gekoppeld. De inhoud van object/array kan wel muteren.',
    arrow: 'Arrow functions: const add = (a,b) => a + b; Korter, en leent this niet automatisch.',
    map: 'Array.map(fn) maakt een NIEUWE array met getransformeerde waarden. Voorbeeld: [1,2].map(x=>x*2) => [2,4].',
    filter: 'Array.filter(fn) houdt alleen items die true geven. Voorbeeld: [1,2,3].filter(x=>x>1) => [2,3].',
    reduce: 'Array.reduce((acc,x)=>acc+x, start) vouwt samen tot één waarde. Voorbeeld som: [1,2,3].reduce((a,b)=>a+b,0).',
    find: 'Array.find(fn) geeft het eerste item dat voldoet of undefined. Handig voor zoeken.',
    includes: 'Array.includes(v) checkt of een waarde erin zit. Voor strings ook beschikbaar.',

    // Async / web
    fetch: 'fetch(url).then(r=>r.json()) of met async/await: const data = await (await fetch(url)).json();',
    promise: 'Een Promise is een resultaat in de toekomst. then/catch of async/await om ermee te werken.',
    async: 'async/await maakt async code leesbaar: try { const r = await fetch(url) } catch(e) { ... }',
    json: 'JSON is tekst met data. Parse met JSON.parse(str) en maak met JSON.stringify(obj).',
    storage: 'localStorage.setItem("k","v"); const v = localStorage.getItem("k"); Blijft staan na refresh.',
    dom: 'DOM manipulatie: document.querySelector(".btn").addEventListener("click", fn);',
    event: 'Events: element.addEventListener("click", (e)=> { e.preventDefault(); ... })',
    regex: 'RegEx: /\d+/ test nummers. "abc123".match(/\d+/) -> ["123"]. Gebruik spaarzaam en test goed.',
    module: 'Modules: export function x(){} en import { x } from "./file.js". type="module" in script tag.',

    // CSS basics
    css: 'Stijl met klassen. Gebruik :root variabelen en utility-classes. Houd specifiteit laag.',
    flex: 'Flexbox: .parent{display:flex; gap:8px; align-items:center; justify-content:space-between;}',
    grid: 'CSS Grid: .g{display:grid; grid-template-columns: repeat(3,1fr); gap:12px;}',
    responsive: 'Responsief: gebruik fluid units (%, rem) en media queries voor breekpunten.',
    media: '@media (min-width:768px){ ... } voor tablet/desktop aanpassingen.',
    var: 'CSS custom properties: :root{--accent:#22c55e} .btn{ color: var(--accent); }',
    box: 'Box model: width/height + padding + border + margin. Gebruik box-sizing: border-box;',

    // Tooling & framework
    git: 'Git basics: git add . → git commit -m "msg" → git push. Gebruik branches voor features.',
    npm: 'npm init -y, npm install pakket. Scripts in package.json. Gebruik npx voor tools zonder globale install.',
    node: 'Node.js runt JS op de server/CLI. Start script met: node index.js of via npm scripts.',
    react: 'React: componenten met props/state. useState en useEffect voor gedrag. Houd componenten klein.',
    vue: 'Vue: template + script + style in één SFC. reactivity eenvoudig en leesbaar.',
    svelte: 'Svelte: compile-time framework. Minder boilerplate, reactivity via toewijzing: count += 1;'
  };

  // Helper om berichten toe te voegen aan de chat
  function addMsg(text, who) {
    const row = document.createElement('div');
    row.className = `chat-msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function botReply(userText) {
    const t = (userText || '').trim().toLowerCase();
    if (t === '') return;
    // Kernboodschap offline
    if (t.includes('hallo') || t.includes('hoi')) {
      addMsg('Hoi! Internet is weg, maar ik kan nog steeds over code praten 🤖.', 'bot');
      return;
    }
    if (t.includes('grap')) {
      addMsg(jokes[Math.floor(Math.random()*jokes.length)], 'bot');
      return;
    }
    if (t.includes('quote')) {
      addMsg(quotes[Math.floor(Math.random()*quotes.length)], 'bot');
      return;
    }
    // Easter eggs / trefwoorden
    for (const key of Object.keys(eggs)) {
      if (t.includes(key)) { addMsg(eggs[key], 'bot'); return; }
    }
    // Fallback met een random quote
    addMsg('Geen netwerk? Geen probleem. ' + quotes[Math.floor(Math.random()*quotes.length)], 'bot');
  }

  function onSend(){
    const val = input.value;
    if (!val.trim()) return;
    addMsg(val, 'you');
    input.value = '';
    setTimeout(()=> botReply(val), 250);
  }

  sendBtn.addEventListener('click', onSend);
  input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') onSend(); });

  // Welkomstbericht
  addMsg('🤖 Hoi! Internet is weg, maar ik kan nog steeds over code praten. Typ "grap", "quote" of "help".', 'bot');
})();

// Offline Coding Challenge: kleine puzzels met een bug
(function(){
  const codeEl = document.querySelector('.ch-code');
  const inputEl = document.querySelector('.ch-input');
  const checkBtn = document.querySelector('.ch-check');
  const newBtn = document.querySelector('.ch-new');
  const resultEl = document.querySelector('.ch-result');
  if (!codeEl || !inputEl || !checkBtn || !newBtn || !resultEl) return;

  // Voorraad van simpele, herkenbare bugs (JS/CSS mix)
  const puzzles = [
    {
      lang: 'js',
      snippet: 'if (x = 5) {\n  console.log("ok");\n}',
      keywords: ['==', '===', 'vergelijk'],
      hint: 'Gebruik vergelijking (== of ===) i.p.v. toewijzing (=).',
      punch: 'Hint: probeer verbinding te herstellen 😉 (en gebruik ===).'
    },
    {
      lang: 'js',
      snippet: 'async function go(){\n  const data = fetch("/api");\n  console.log(data.json());\n}',
      keywords: ['await', 'then'],
      hint: 'Je moet op het antwoord wachten (await) of then() gebruiken.',
      punch: 'Offline? Wachten… wachten… Probeer: const r = await fetch(...);'
    },
    {
      lang: 'js',
      snippet: 'const nums = [1,2,3];\nconst doubled = nums.forEach(n => n*2);\nconsole.log(doubled);',
      keywords: ['map'],
      hint: 'forEach geeft niets terug. Gebruik map voor een nieuwe array.',
      punch: 'Gebruik: const doubled = nums.map(n=>n*2);'
    },
    {
      lang: 'css',
      snippet: '.box {\n  display: flex;\n  align-items: center;\n  justify-content: middle;\n}',
      keywords: ['center'],
      hint: 'justify-content gebruikt center, niet middle.',
      punch: 'Tip: justify-content: center;'
    },
    {
      lang: 'js',
      snippet: 'function add(a,b){\n  return\n    a + b;\n}\nconsole.log(add(2,3));',
      keywords: ['return', 'same', 'zelfde lijn', 'semicolon'],
      hint: 'Automatic Semicolon Insertion breekt de return. Zet de waarde op dezelfde regel.',
      punch: 'Zet: return a + b; op één regel.'
    },
    {
      lang: 'js',
      snippet: 'const user = null;\nconsole.log(user.name);',
      keywords: ['optional', '?.', 'null check'],
      hint: 'Bescherm toegang als iets null/undefined kan zijn.',
      punch: 'Gebruik optional chaining: user?.name'
    }
  ];

  let current = null;

  function pickPuzzle(){
    current = puzzles[Math.floor(Math.random()*puzzles.length)];
    codeEl.textContent = current.snippet;
    resultEl.textContent = '';
    inputEl.value = '';
  }

  function check(){
    const guess = (inputEl.value || '').trim().toLowerCase();
    if (!guess) { resultEl.textContent = 'Typ je gok (bijv. ===, await, map, center, ?. ).'; return; }
    // simpele keyword match
    const ok = current.keywords.some(k => guess.includes(k));
    if (ok) {
      resultEl.innerHTML = '<span class="success">✅ Goed! ' + (current.hint || '') + '</span>';
    } else {
      resultEl.textContent = current.punch;
    }
  }

  checkBtn.addEventListener('click', check);
  inputEl.addEventListener('keydown', (e)=>{ if (e.key==='Enter') check(); });
  newBtn.addEventListener('click', pickPuzzle);

  // Init
  pickPuzzle();
})();

// Reconnect animatie/toast en automatische terugkeer naar de site
(function(){
  function showToast(message){
    try {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = message;
      document.body.appendChild(t);
      setTimeout(()=>{ t.remove(); }, 2400);
    } catch {}
  }

  window.addEventListener('online', () => {
    // Toon korte toast en ga terug naar de hoofdsite
    showToast('🔌 Verbonden! Deploying happiness…');
    setTimeout(()=>{ try { location.replace('/'); } catch { location.href = '/'; } }, 1500);
  });
})();
