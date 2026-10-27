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
    const t = String(v).replace(/[−–]/g, '-').replace(/(\d),(?=\d{3}(?!\d))/g, '$1') // 80,000 = 80000
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

  // האם התשובה נכונה. want: מחרוזת | { a, tol, not } | { days } | { ranges } | { area } | { path } | { points }
  //   | { pick, from, other }.
  // choice = בחירה מרשימה.
  function isCorrect(v, want, unit, choice) {
    v = String(v || '').trim();
    if (!v || unitProblem(v, unit)) return false;
    if (choice) return v === want;
    if (want.area) {
      try { const pts = JSON.parse(v); return pointIn(pts[pts.length - 1], want.area); } catch (e) { return false; }
    }
    if (want.path) return samePath(v, want.path);
    if (want.pie) return samePie(v, want);
    if (want.estimate) return pieEstimateOk(v, want.estimate);
    if (want.bars) { try { return JSON.stringify(JSON.parse(v)) === JSON.stringify(want.bars); } catch (e) { return false; } }
    if (want.points) return samePoints(v, want.points);
    if (want.pick) {
      // "תנו דוגמה ל-2 חודשים": לפחות pick מילים מתוך from, ואף מילה מתוך other
      const good = want.from.filter(w => v.includes(w)).length;
      return good >= want.pick && !(want.other || []).some(w => v.includes(w));
    }
    if (want.days) return sameDays(v, want.days);
    if (want.ranges) return sameRanges(v, want.ranges);
    const text = typeof want === 'string' ? want : want.a;
    const w = numbers(text);
    // בלי מספרים ("קטנה", "תפוח ואגס") – כל המילים מופיעות, ו-not לא מופיעה
    if (!w.length) {
      return text.split(/\s+/).map(x => x.replace(/^ו(?=..)/, '').replace(/ה$/, '')).every(x => v.includes(x)) &&
        !(want.not && v.includes(want.not));
    }
    // word = מילה שחייבת להופיע ליד המספר (למשל "נשוא" בגזרה של הנשואים)
    if (want.word && !v.includes(want.word)) return false;
    // spell = מספרים במילים ("שעתיים", "עבירה אחת") – בכיתוב בתוך גזרות של דיאגרמת עיגול
    const tol = want.tol || 0.01, got = numbers(want.spell ? spelled(v) : v);
    return got.length === w.length && got.every((x, i) => Math.abs(x - w[i]) <= tol);
  }

  const SPELL = { אחת: 1, אחד: 1, שתיים: 2, שניים: 2, שתי: 2, שני: 2, שלוש: 3, שלושה: 3, ארבע: 4, ארבעה: 4 };
  const spelled = v => v.replace(/שעתיים/g, '2 שעות')
    .replace(/(^|[^א-ת])(אחת|אחד|שתיים|שניים|שתי|שני|שלושה|שלוש|ארבעה|ארבע)(?![א-ת])/g, (m, b, w) => b + SPELL[w]);

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

  // עוגה שנצבעה (מערך: הקבוצה של כל גזרה, −1 = לא צבוע) מול מספר הגזרות שכל קבוצה צריכה (pie).
  // כל קבוצה ברצף אחד, ועד tol גזרות סטייה לכל קבוצה (וגם לגזרות שלא נצבעו)
  function samePie(v, want) {
    let arr;
    try { arr = JSON.parse(v); } catch (e) { return false; }
    const n = arr.length, tol = want.tol || 0;
    if (arr.filter(x => x < 0).length > tol) return false;
    return want.pie.every((need, g) => {
      const count = arr.filter(x => x === g).length;
      const runs = arr.filter((x, i) => x === g && arr[(i - 1 + n) % n] !== g).length;
      return Math.abs(count - need) <= tol && (count === 0 || runs === 1 || count === n);
    });
  }

  // עוגה שחולקה בהערכה: { b: קווי חלוקה (0–1, לפי כיוון השעון מלמעלה), g: הקבוצה של כל גזרה }.
  // מחזיר את האחוז של כל קבוצה, או null אם יש גזרה שלא נצבעה
  function pieShares(v, groups, partial) {
    let d;
    try { d = JSON.parse(v); } catch (e) { return null; }
    const b = (d.b || []).slice().sort((x, y) => x - y), k = Math.max(1, b.length), shares = Array(groups).fill(0);
    for (let i = 0; i < k; i++) {
      const g = d.g ? d.g[i] : -1;
      if (g === undefined || g < 0) { if (partial) continue; return null; }
      const s = b.length ? b[i] : 0, e = b.length ? b[(i + 1) % k] + (i + 1 === k ? 1 : 0) : 1;
      shares[g] += (b.length === 1 ? 1 : e - s) * 100;
    }
    return shares;
  }
  // סטייה מותרת בהערכה: 20% מהגודל, ולפחות 3 נקודות אחוז
  const estTol = t => Math.max(3, t * 0.2);
  function pieEstimateOk(v, want) {
    const sh = pieShares(v, want.length);
    return !!sh && want.every((t, g) => sh[g] > 0 && Math.abs(sh[g] - t) <= estTol(t));
  }
  // משוב על עוגה בהערכה: איזו קבוצה גדולה או קטנה מדי, ובערך כמה היא צריכה להיות
  function rough(t) {
    return t >= 45 ? 'בערך חצי עיגול' : t >= 33 ? 'קצת פחות מחצי עיגול' : t >= 22 ? 'בערך רבע עיגול'
      : t >= 14 ? 'קצת פחות מרבע עיגול' : t >= 8 ? 'בערך עשירית מהעיגול' : 'חלק קטן מאוד מהעיגול';
  }
  function pieEstimateAdvice(v, want, names) {
    const sh = pieShares(v, want.length, true);
    if (!sh) return [];
    const blank = pieShares(v, want.length) ? [] : ['יש גזרה שעוד לא צבעתם.'];
    return blank.concat(want.map((t, g) => sh[g] <= 0 ? names[g] + ': חסרה גזרה (' + rough(t) + ').'
      : sh[g] - t > estTol(t) ? names[g] + ': הגזרה גדולה מדי (צריך ' + rough(t) + ').'
      : t - sh[g] > estTol(t) ? names[g] + ': הגזרה קטנה מדי (צריך ' + rough(t) + ').' : '').filter(Boolean));
  }

  // נקודות שסומנו מול הנקודות הנכונות (אותה קבוצה, בלי חשיבות לסדר)
  function samePoints(v, want) {
    let pts;
    try { pts = JSON.parse(v); } catch (e) { return false; }
    const near = (p, q) => Math.abs(p[0] - q[0]) < 0.015 && Math.abs(p[1] - q[1]) < 0.015;
    return pts.length === want.length && want.every(w => pts.some(p => near(p, w)));
  }

  window.GraphCheck = { pieShares, pieEstimateAdvice, unitProblem, numbers, dayList, sameDays, daySegments, sameRanges, isCorrect, signSlip, pointIn };
})();
