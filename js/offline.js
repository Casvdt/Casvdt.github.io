/*
 * Offline pagina JavaScript (NL)
 * Inhoud/secties:
 * 1) Typewriter-animatie: typt regels tekst met kleine pauzes en cursor.
 * 2) Mini‑game: bugs vangen met levels, power‑ups en score (delta‑time animatie).
 * 3) Offline Chatbot: simpele rule‑based antwoorden, grappen/quotes, NL tips.
 * 4) Offline Coding Challenge: random puzzels met kleine bugfix‑gok.
 * 5) Reconnect: toast wanneer online en automatische terugkeer naar de site.
 *
 * Doel: eenvoudige, duidelijke offline‑ervaring met weinig afhankelijkheden.
 */

// ...existing code...

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

// Offline Coding Challenge (NL): eenvoudige editor + console
(function(){
  const taskEl = document.querySelector('.ch-task');
  const editor = document.querySelector('.ch-editor');
  const consoleEl = document.querySelector('.ch-console');
  const runBtn = document.querySelector('.ch-run');
  const resetBtn = document.querySelector('.ch-reset');
  const newBtn = document.querySelector('.ch-new');
  const resultEl = document.querySelector('.ch-result');
  if (!taskEl || !editor || !consoleEl || !runBtn || !resetBtn || !newBtn || !resultEl) return;

  // Puzzels: id + opdracht + startcode + validator (controleert console output)
  const puzzles = [
    {
      id: 'square',
      task: 'Maak een functie square(n) die n*n teruggeeft. Verwachte uitvoer: 9 en 16.',
      starter: 'function square(n){\n  // TODO: geef het kwadraat terug\n}\n\nconsole.log(square(3));\nconsole.log(square(4));',
      validate: (out)=> out.join('\n').trim() === '9\n16'
    },
    {
      id: 'map-vs-foreach',
      task: 'Fix: map i.p.v. forEach. Log [2,4,6].',
      starter: 'const nums = [1,2,3];\nconst doubled = nums.forEach(n => n*2); // BUG: forEach geeft niets terug\nconsole.log(doubled);',
      validate: (out)=> out.length && out[0].replace(/\s/g,'') === '[2,4,6]'
    },
    {
      id: 'optional-chaining',
      task: 'Gebruik optional chaining om user.name veilig te loggen (verwacht: undefined, dan "Cas").',
      starter: 'let user = null;\nconsole.log(user.name); // BUG: kan crashen\nuser = { name: "Cas" };\nconsole.log(user.name);',
      validate: (out)=> out.length>=2 && /undefined/i.test(out[0]) && /Cas/.test(out[1])
    },
    {
      id: 'async-answer',
      task: 'Maak een async functie die 42 retourneert en log de waarde via await.',
      starter: 'async function answer(){\n  // TODO: return 42\n}\n\n(async()=>{\n  const v = await answer();\n  console.log(v); // verwacht 42\n})();',
      validate: (out)=> out.join('').trim() === '42'
    },
    {
      id: 'sum-reduce',
      task: 'Tel alle getallen op met reduce. Verwacht: 10.',
      starter: 'const arr = [1,2,3,4];\n// TODO: gebruik reduce om de som te berekenen\nconst total = 0;\nconsole.log(total);',
      validate: (out)=> out.join('').trim() === '10'
    },
    {
      id: 'reverse-string',
      task: 'Schrijf reverse(str) die een string omdraait. Verwacht: "olleh".',
      starter: 'function reverse(str){\n  // TODO\n}\n\nconsole.log(reverse("hello"));',
      validate: (out)=> out.join('').trim() === 'olleh'
    },
    {
      id: 'palindrome',
      task: 'Schrijf isPalindrome(str) (case-insensitive). Verwacht: true, false.',
      starter: 'function isPalindrome(str){\n  // TODO: negeer hoofd/kleine letters\n}\n\nconsole.log(isPalindrome("Level"));\nconsole.log(isPalindrome("Code"));',
      validate: (out)=> out.length>=2 && /true/i.test(out[0]) && /false/i.test(out[1])
    }
  ];

  let current = null;

  function setConsole(lines){
    consoleEl.textContent = lines.join('\n');
  }

  function storageKey(p){ return 'offline_ch_editor_' + (p && p.id ? p.id : 'unknown'); }

  function pickPuzzle(){
    current = puzzles[Math.floor(Math.random()*puzzles.length)];
    taskEl.textContent = 'Opdracht: ' + current.task;
    // Herstel lokale voortgang indien aanwezig
    try {
      const saved = localStorage.getItem(storageKey(current));
      editor.value = saved != null ? saved : current.starter;
    } catch {
      editor.value = current.starter;
    }
    setConsole([]);
    resultEl.textContent = '';
  }

  async function runCode(){
    const logs = [];
    // Simpele console-capture
    const fakeConsole = { log: (...args)=> logs.push(args.map(String).join(' ')) };
    try {
      // Voer in een Async IIFE uit, zodat await werkt
      const fn = new Function('console', 'return (async()=>{\n' + editor.value + '\n})()');
      await fn(fakeConsole);
      setConsole(logs);
      const ok = current.validate(logs);
      resultEl.innerHTML = ok ? '<span class="success">✅ Correct!</span>' : '❌ Nog niet goed. Tip: lees de opdracht goed.';
    } catch (e) {
      setConsole(logs.concat('Error: ' + (e && e.message ? e.message : String(e))));
      resultEl.textContent = '❌ Runtime error — los de fout op.';
    }
    // Sla huidige code op voor deze puzzel
    try { localStorage.setItem(storageKey(current), editor.value); } catch {}
  }

  function resetCode(){ editor.value = current.starter; setConsole([]); resultEl.textContent = ''; try { localStorage.removeItem(storageKey(current)); } catch {} }

  runBtn.addEventListener('click', runCode);
  resetBtn.addEventListener('click', resetCode);
  newBtn.addEventListener('click', pickPuzzle);

  // Live opslaan bij typen (lichtgewicht)
  editor.addEventListener('input', ()=>{ try { localStorage.setItem(storageKey(current), editor.value); } catch {} });

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

  // Als iemand offline.html direct bezoekt terwijl we online zijn: stuur terug
  const debugBypass = /(?:[?&])debugOffline=1\b/.test(location.search);
  if (navigator.onLine && !debugBypass) {
    // korte melding en direct terug
    showToast('🌐 Online gedetecteerd. Terug naar de site…');
    setTimeout(()=>{ try { location.replace('/'); } catch { location.href = '/'; } }, 600);
  }
})();
