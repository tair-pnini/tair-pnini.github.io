// בדיקת תשובות לדפי הגרפים. set.html משתמש בזה, ו-_local/check-test.html בודק את זה על הרבה כתיבים.
// צריך את GRAPH_UNITS מ-data.js.
(function () {
  const ORD = { ראשון: 1, שני: 2, שלישי: 3, רביעי: 4, חמישי: 5, שישי: 6, שביעי: 7, שמיני: 8, תשיעי: 9, עשירי: 10 };
  const DAY = { ראשון: 'א', שני: 'ב', שלישי: 'ג', רביעי: 'ד', חמישי: 'ה', שישי: 'ו', שבת: 'ש' };
  // ימי השבוע על ציר הגרף: א' עד א' של השבוע הבא
  const AXIS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  // '' = בסדר; אחרת – מה חסר ביחידה
  function unitProblem(v, unit) {
    v = String(v || '').trim();
    if (!v || !unit) return '';
    const norm = v.toLowerCase().replace(/["'״׳.\s]/g, '');
    if (GRAPH_UNITS[unit].test(norm)) return '';
    return Object.values(GRAPH_UNITS).some(re => re.test(norm)) ? 'בדקו את יחידת המידה.' : 'חסרה יחידת מידה.';
  }

  // המספרים בתשובה, ממוינים. שעה 7:30 = 7.5, 24:00 = 0, "הרביעי" = 4. מינוס רק בתחילת מספר ("ה-4" הוא 4).
  function numbers(v) {
    const t = String(v).replace(/[−–]/g, '-')
      .replace(/(^|[^א-ת])[ובל]?ה?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שביעי|שמיני|תשיעי|עשירי)(?![א-ת])/g,
        (m, before, w) => before + ORD[w]);
    return [...t.matchAll(/(?:(?<=^|[\s(=])-)?\d+(?::\d\d|\.\d+)?/g)].map(m => {
      const x = m[0];
      if (!x.includes(':')) return parseFloat(x);
      const [h, mi] = x.split(':').map(Number);
      return (h % 24) + mi / 60;
    }).sort((a, b) => a - b);
  }

  // ימי השבוע בתשובה, לפי הסדר: "בין ו' לשבת" -> ו ש, "ג' וה'" -> ג ה, "יום רביעי" -> ד
  function dayList(v) {
    const t = (' ' + v + ' ').replace(/["״]/g, '')
      .replace(/(^|[^א-ת])[ולבמ]?-?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?![א-ת])/g, (m, before, d) => before + ' ' + DAY[d] + ' ')
      .replace(/(^|[^א-ת])[ו]?(לא|כולל|ימים|יום|בין|עד|הימים|היום)(?!['׳א-ת])/g, '$1 '); // "לא'" = ל + א'
    const out = [];
    for (const m of t.matchAll(/(?<![א-ת])([ולבמ]-?)?([אבגדהוש])(?![א-ת])/g)) {
      // ו/ב בתחילת התשובה הם ימים ולא תחילית: "ו-ש" = שישי עד שבת, "ב-ד" = שני עד רביעי
      if (m[1] && !out.length && /^[וב]/.test(m[1])) out.push(m[1][0]);
      out.push(m[2]);
    }
    return out;
  }
  const sameDays = (v, want) => dayList(v).sort().join() === dayList(want).sort().join();

  // טווחי ימים כקבוצה של קטעים על הציר: "בין א' ל-ג', בין ה' ל-א'" = קטעים 0,1 + 4,5,6.
  // לא משנה סדר הטווחים, כיוון הכתיבה (ד'-ב' כמו ב'-ד') או פיצול (א'-ב' ו-ב'-ג' כמו א'-ג').
  // א' בסוף טווח שמתחיל ביום אחר הוא א' של השבוע הבא ("בין ה' ל-א'").
  function daySegments(v) {
    const d = dayList(v);
    if (!d.length || d.length % 2) return null;
    const seg = new Set();
    for (let i = 0; i < d.length; i += 2) {
      let a = AXIS.indexOf(d[i]), b = AXIS.indexOf(d[i + 1]);
      if (d[i + 1] === 'א' && a > 0) b = 7;
      if (b < a) [a, b] = [b, a];
      for (let s = a; s < b; s++) seg.add(s);
    }
    return [...seg].sort().join();
  }
  const sameRanges = (v, want) => { const s = daySegments(v); return s !== null && s === daySegments(want); };

  // האם התשובה נכונה. want: מחרוזת | { a, tol, not } | { days } | { ranges } | { area } | { path }.
  // choice = בחירה מרשימה.
  function isCorrect(v, want, unit, choice) {
    v = String(v || '').trim();
    if (!v || unitProblem(v, unit)) return false;
    if (choice) return v === want;
    if (want.area) {
      try { const pts = JSON.parse(v); return pointIn(pts[pts.length - 1], want.area); } catch (e) { return false; }
    }
    if (want.path) return samePath(v, want.path);
    if (want.days) return sameDays(v, want.days);
    if (want.ranges) return sameRanges(v, want.ranges);
    const text = typeof want === 'string' ? want : want.a;
    const w = numbers(text);
    // בלי מספרים ("קטנה", "תפוח ואגס") – כל המילים מופיעות, ו-not לא מופיעה
    if (!w.length) {
      return text.split(/\s+/).map(x => x.replace(/^ו(?=..)/, '').replace(/ה$/, '')).every(x => v.includes(x)) &&
        !(want.not && v.includes(want.not));
    }
    const tol = want.tol || 0.01, got = numbers(v);
    return got.length === w.length && got.every((x, i) => Math.abs(x - w[i]) <= tol);
  }

  // תשובה לא נכונה שבה רק הסימן הפוך (2.5 במקום −2.5)
  function signSlip(v, want, unit) {
    v = String(v || '').trim();
    if (!v || typeof want !== 'string' || unitProblem(v, unit) || isCorrect(v, want, unit)) return false;
    const abs = a => a.map(Math.abs).sort((x, y) => x - y);
    const w = abs(numbers(want)), got = abs(numbers(v));
    return w.length > 0 && got.length === w.length && got.every((x, i) => Math.abs(x - w[i]) < 0.01);
  }

  // נקודה שסומנה על הגרף (x, y בין 0 ל-1 ביחס לתמונה) בתוך תחום: { x: [מ, עד], y: [מ, עד] }
  const pointIn = (p, area) => !!p && p[0] >= area.x[0] && p[0] <= area.x[1] && p[1] >= area.y[0] && p[1] <= area.y[1];

  // קטעים ששורטטו (נקודות JSON, כל שתי לחיצות רצופות = קטע) מול "חברו כל שתי נקודות סמוכות":
  // נכון אם יש בדיוק את הקטעים בין כל שתי נקודות סמוכות ב-path – בכל סדר ובכל כיוון, בלי קטעים מיותרים.
  function samePath(v, path) {
    let pts;
    try { pts = JSON.parse(v); } catch (e) { return false; }
    const idx = p => path.findIndex(n => Math.abs(n[0] - p[0]) < 0.01 && Math.abs(n[1] - p[1]) < 0.01);
    const got = new Set();
    for (let i = 1; i < pts.length; i++) {
      const a = idx(pts[i - 1]), b = idx(pts[i]);
      if (a === b) continue; // לחיצה כפולה על אותה נקודה
      if (a < 0 || b < 0 || Math.abs(a - b) !== 1) return false; // קטע לנקודה אחרת או מעל נקודה
      got.add(Math.min(a, b));
    }
    return got.size === path.length - 1;
  }

  window.GraphCheck = { unitProblem, numbers, dayList, sameDays, daySegments, sameRanges, isCorrect, signSlip, pointIn };
})();
