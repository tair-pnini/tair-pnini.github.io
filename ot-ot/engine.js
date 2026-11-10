// אות-אות: מנוע החידה. הקובץ זהה ב-tair-pnini.github.io/ot-ot ו-gifted-teachers-il.github.io/math/quote-1.
// הציטוט וההגדרות (PUZZLE) נמצאים ב-index.html של כל דף.

const TO_REGULAR = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const TO_FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
// מאפשר להקליד גם כשהמקלדת הפיזית על אנגלית
const KEY_CODES = {
  KeyE: 'ק', KeyR: 'ר', KeyT: 'א', KeyY: 'ט', KeyU: 'ו', KeyI: 'נ', KeyO: 'מ', KeyP: 'פ',
  KeyA: 'ש', KeyS: 'ד', KeyD: 'ג', KeyF: 'כ', KeyG: 'ע', KeyH: 'י', KeyJ: 'ח', KeyK: 'ל',
  KeyL: 'כ', Semicolon: 'פ', KeyZ: 'ז', KeyX: 'ס', KeyC: 'ב', KeyV: 'ה', KeyB: 'נ',
  KeyN: 'מ', KeyM: 'צ', Comma: 'ת', Period: 'צ',
};

function clean(text) {
  return text
    .replace(/[֑-ׇ]/g, (c) => (c === '־' ? ' ' : ''))
    .replace(/-/g, ' ')
    .replace(/[ךםןףץ]/g, (c) => TO_REGULAR[c])
    .replace(/[^א-ת ]/g, '')
    .replace(/ +/g, ' ')
    .trim();
}

function makeRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const random = makeRandom(PUZZLE.seed);
const COLS = PUZZLE.cols;
const text = [...clean(PUZZLE.quote)];
const total = Math.ceil(text.length / COLS) * COLS;
const solution = Array.from({ length: total }, (_, i) => text[i] || ' ');
const isBlack = (i) => solution[i] === ' ';
const isWordEnd = (i) => !isBlack(i) && (i + 1 >= total || isBlack(i + 1));
const shown = (letter, wordEnd) => (wordEnd && TO_FINAL[letter]) || letter;

const columnLetters = Array.from({ length: COLS }, (_, col) =>
  shuffled(solution.filter((c, i) => i % COLS === col && c !== ' '), random)
);
const tallest = Math.max(...columnLetters.map((c) => c.length));

// עיגולים: לכל אות במקור נבחרת משבצת אקראית עם אותה אות במשפט
const sourceChars = [...clean(PUZZLE.source)];
const ringOf = new Map();
const givenSource = new Set();
const free = shuffled(solution.map((_, i) => i).filter((i) => !isBlack(i)), random);
sourceChars.forEach((letter, s) => {
  if (letter === ' ') return;
  const at = free.findIndex((i) => solution[i] === letter);
  if (at < 0) { givenSource.add(s); return; }
  ringOf.set(free[at], s);
  free.splice(at, 1);
});

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
document.documentElement.style.setProperty('--cols', COLS);

let board, available, active, started, locked, checks, startedAt, ticker, markTimer;
const marked = new Set(); // משבצות שגויות שמסומנות אחרי בדיקה
const MARK_MS = 2000;

function clearMarks() {
  clearTimeout(markTimer);
  marked.clear();
}

function clearBoard() {
  board = solution.map(() => '');
  available = columnLetters.map((c) => [...c]);
  active = solution.findIndex((c) => c !== ' ');
}

// "מחדש" באמצע משחק: לוח נקי, אבל הזמן והבדיקות ממשיכים
function restart() {
  clearBoard();
  clearMarks();
  $('msg').textContent = '';
  render();
}

function reset() {
  clearBoard();
  started = false;
  locked = false;
  checks = 0;
  clearInterval(ticker);
  clearMarks();
  $('checks').textContent = '0';
  $('time').textContent = '00:00';
  $('msg').textContent = '';
  $('start').textContent = 'התחלה';
  $('check').disabled = true;
  $('erase').disabled = true;
  $('zero').disabled = true;
  boardEl.classList.add('waiting');
  render();
}

function start() {
  started = true;
  startedAt = Date.now();
  ticker = setInterval(showTime, 500);
  $('start').textContent = 'מחדש';
  $('check').disabled = false;
  $('erase').disabled = false;
  $('zero').disabled = false;
  boardEl.classList.remove('waiting');
  boardEl.classList.add('drop');
  render();
  setTimeout(() => boardEl.classList.remove('drop'), 1500);
}

function elapsed() {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function showTime() { $('time').textContent = elapsed(); }

function render() {
  const activeCol = active % COLS;
  const tops = $('tops');
  tops.replaceChildren(...available.map((letters, col) => {
    const stack = document.createElement('div');
    stack.className = 'stack' + (started && !locked && col === activeCol ? ' on' : '');
    stack.style.minHeight = `calc(${tallest} * min(36px, var(--cell)))`;
    letters.forEach((letter, row) => {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.textContent = letter;
      tile.setAttribute('aria-label', `האות ${letter}, עמודה ${col + 1}`);
      tile.style.setProperty('--d', `${col * 0.025 + row * 0.08}s`);
      tile.addEventListener('click', () => tapTile(col, letter));
      stack.append(tile);
    });
    return stack;
  }));

  const grid = $('grid');
  grid.replaceChildren(...solution.map((_, i) => {
    const cell = document.createElement('button');
    cell.dataset.i = i;
    cell.className = 'cell';
    if (isBlack(i)) {
      cell.classList.add('black');
      cell.disabled = true;
      cell.setAttribute('aria-hidden', 'true');
      return cell;
    }
    if (ringOf.has(i)) cell.classList.add('ring');
    if (started && !locked && i % COLS === activeCol) cell.classList.add('column');
    if (started && !locked && i === active) cell.classList.add('on');
    if (marked.has(i)) cell.classList.add('wrong');
    cell.textContent = board[i] ? shown(board[i], isWordEnd(i)) : '';
    cell.setAttribute('aria-label', `שורה ${Math.floor(i / COLS) + 1}, משבצת ${(i % COLS) + 1}`);
    cell.addEventListener('click', () => { if (started && !locked) { active = i; render(); } });
    return cell;
  }));

  const typedInSource = new Map([...ringOf].map(([cell, s]) => [s, board[cell]]));
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'מקור:';
  const circles = sourceChars.map((letter, s) => {
    const el = document.createElement('span');
    if (letter === ' ') { el.className = 'gap'; return el; }
    el.className = 'src';
    const wordEnd = s + 1 >= sourceChars.length || sourceChars[s + 1] === ' ';
    if (givenSource.has(s)) { el.classList.add('given'); el.textContent = shown(letter, wordEnd); }
    else if (typedInSource.get(s)) el.textContent = shown(typedInSource.get(s), wordEnd);
    return el;
  });
  const parts = [label, ...circles];
  if (PUZZLE.sourceNote) {
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = PUZZLE.sourceNote;
    parts.push(note);
  }
  $('source').replaceChildren(...parts);
}

function flash(i) {
  const el = document.querySelector(`.cell[data-i="${i}"]`);
  if (!el) return;
  el.classList.remove('nope');
  void el.offsetWidth;
  el.classList.add('nope');
}

function step(from, delta) {
  let i = from + delta;
  while (i >= 0 && i < total && isBlack(i)) i += delta;
  return i >= 0 && i < total ? i : from;
}

function put(letter) {
  const col = active % COLS;
  const old = board[active];
  if (old !== letter && !available[col].includes(letter)) { flash(active); return; }
  if (old) available[col].unshift(old);
  available[col].splice(available[col].indexOf(letter), 1);
  board[active] = letter;
  marked.delete(active);
  $('msg').textContent = '';
  active = step(active, 1);
  render();
  if (isFull()) checkFull();
}

function erase() {
  if (!board[active]) active = step(active, -1);
  if (board[active]) {
    available[active % COLS].unshift(board[active]);
    board[active] = '';
    marked.delete(active);
    $('msg').textContent = '';
  }
  render();
}

function tapTile(col, letter) {
  if (!started || locked) return;
  if (col === active % COLS) { put(letter); return; }
  // אות מעמודה אחרת: עוברים למשבצת הריקה הראשונה בעמודה ההיא
  const target = solution.findIndex((c, i) => i % COLS === col && c !== ' ' && !board[i]);
  if (target >= 0) { active = target; render(); }
}

const isFull = () => solution.every((c, i) => c === ' ' || board[i]);
const isCorrect = () => solution.every((c, i) => c === ' ' || board[i] === c);

function checkFull() {
  if (isCorrect()) win();
  else $('msg').textContent = 'הטבלה מלאה, אבל יש בה לפחות טעות אחת.';
}

function check() {
  if (!started || locked) return;
  checks++;
  $('checks').textContent = checks;
  const wrong = solution.flatMap((c, i) => (c !== ' ' && board[i] && board[i] !== c ? [i] : []));
  clearMarks();
  if (!wrong.length) {
    render();
    if (isFull()) win();
    else $('msg').textContent = 'הכל תקין!';
    return;
  }
  wrong.forEach((i) => marked.add(i));
  render();
  $('msg').textContent = wrong.length === 1 ? 'יש טעות אחת.' : `יש ${wrong.length} טעויות.`;
  markTimer = setTimeout(() => { marked.clear(); render(); }, MARK_MS);
}

function win() {
  locked = true;
  clearInterval(ticker);
  const time = elapsed();
  $('time').textContent = time;
  $('msg').textContent = '';
  $('check').disabled = true;
  $('erase').disabled = true;
  disarmZero();
  $('zero').disabled = true;
  render();
  const checksText = checks === 0 ? 'בלי בדיקות' : checks === 1 ? 'בדיקה אחת' : `${checks} בדיקות`;
  $('doneQuote').textContent = PUZZLE.quote;
  $('doneWho').textContent = PUZZLE.sourceNote ? `${PUZZLE.source} ${PUZZLE.sourceNote}` : PUZZLE.source;
  $('doneStats').innerHTML = `זמן: <span dir="ltr">${time}</span> · ${checksText}`;
  shareText = `פתרתי את ${PUZZLE.shareName || 'אות-אות'}! 🎉\nזמן: ${time} · בדיקות: ${checks}\nעכשיו תורך: ${location.origin + location.pathname}`;
  $('share').textContent = SHARE_LABEL;
  $('done').showModal();
}

// איפוס מלא של הזמן והבדיקות: לחיצה ראשונה מזהירה, השנייה מאפסת
const ZERO_LABEL = 'איפוס זמן ובדיקות';
let zeroArmed = false;
let zeroTimer;

function disarmZero() {
  clearTimeout(zeroTimer);
  zeroArmed = false;
  $('zero').textContent = ZERO_LABEL;
}

function pressZero() {
  if (!started || locked) return;
  if (zeroArmed) {
    disarmZero();
    reset();
    return;
  }
  zeroArmed = true;
  $('zero').textContent = 'בלי לרמות, כן? 😉 לוחצים שוב לאיפוס';
  zeroTimer = setTimeout(disarmZero, 4000);
}

const SHARE_LABEL = 'העתקה לשיתוף';
let shareText = '';

async function copyShare() {
  let ok = false;
  try {
    await navigator.clipboard.writeText(shareText);
    ok = true;
  } catch {
    const box = document.createElement('textarea');
    box.value = shareText;
    $('done').append(box);
    box.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    box.remove();
  }
  $('share').textContent = ok ? 'הועתק ✓' : 'ההעתקה לא הצליחה';
  setTimeout(() => { $('share').textContent = SHARE_LABEL; }, 2500);
}

document.addEventListener('keydown', (e) => {
  if (!started || locked || $('done').open || e.ctrlKey || e.metaKey || e.altKey) return;
  const moves = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: COLS, ArrowUp: -COLS };
  if (moves[e.key]) { e.preventDefault(); active = step(active, moves[e.key]); render(); return; }
  if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); erase(); return; }
  const key = e.key.length === 1 && /[א-ת]/.test(e.key) ? (TO_REGULAR[e.key] || e.key) : KEY_CODES[e.code];
  if (key) { e.preventDefault(); put(key); }
});

$('start').addEventListener('click', () => {
  if (!started) start();
  else if (locked) reset();
  else restart();
});
$('share').addEventListener('click', copyShare);
$('zero').addEventListener('click', pressZero);
$('check').addEventListener('click', check);
$('erase').addEventListener('click', () => { if (started && !locked) erase(); });
$('closeDone').addEventListener('click', () => $('done').close());

reset();
