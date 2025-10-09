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
    '“Talk is cheap. Show me the code.” – Linus Torvalds'
  ];
  const jokes = [
    'Waarom was de JavaScript developer verdrietig? Omdat hij Node hoe Express hij zich voelde.',
    'Ik heb 99 problemen, maar een semicolon is er geen; of juist wel? ;)',
    'There are only 10 types of people: those who understand binary and those who don’t.'
  ];
  const eggs = {
    help: 'Typ: "grap", "quote", "ascii", of stel een vraag over code (bijv. "array", "async").',
    ascii: '┌( ಠ‿ಠ)┘  └(ಠ‿ಠ )┐  Dance mode: ASCII enabled!',
    array: 'Arrays zijn geordende lijsten. Pro tip: .map/.filter/.reduce zijn je beste vrienden.',
    async: 'Async/await maakt async code leesbaar. Vergeet niet try/catch en Promise.all waar zinnig!',
    css: 'CSS tip: gebruik custom properties (variabelen) en "will-change" met beleid voor performance.'
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
