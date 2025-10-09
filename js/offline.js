// Offline pagina uitbreidingen (NL):
// - Eenvoudige typewriter-animatie voor tekst
// - Mini-game met bugs vangen inclusief levels, power-ups en score

// Typewriter animatie: typt regels tekst één voor één
(function(){
  const el = document.getElementById('typewriter');
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
  const board = document.getElementById('board');
  const startBtn = document.getElementById('start');
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const bugCountEl = document.getElementById('bug-count');
  const resultEl = document.getElementById('result');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
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
    timeEl.textContent = String(time);
    if (linesEl) linesEl.textContent = '0';
    if (levelEl) levelEl.textContent = '1';
    resultEl.textContent = '';
    Array.from(board.querySelectorAll('.bug')).forEach(b=>{ cancelAnimationFrame(b._raf); b.remove(); });
    bugCountEl.textContent = '0';
    scheduleSpawns(900); // begin met relatief rustig tempo
    tickInt = setInterval(()=>{
      time--; timeEl.textContent = String(time); // aftellen
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
    bugCountEl.textContent = '0';
    const msg = score >= 10
      ? `✅ Ready to deploy! Great job catching bugs. Lines of code saved: ${linesSaved}.`
      : `🛠️ A few bugs slipped through. Lines of code saved: ${linesSaved}. Try again!`;
    resultEl.innerHTML = '<span class="' + (score>=10?'success':'') + '\">' + msg + '</span>';
  }

  startBtn.addEventListener('click', start);

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
