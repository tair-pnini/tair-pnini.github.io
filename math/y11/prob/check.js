// בדיקת תשובות לתרגול ההסתברות. set.html משתמש בזה.
// מספר = עשרוני (0.3, ‎.3, 0,3), שבר (3/4) או אחוז (75%) – כולם שווים אם הערך שווה.
// תרגיל = כפל (· * x ×) וחיבור/חיסור, עם סוגריים. "התרגיל נכון" = אותן מכפלות כמו בתרגיל הצפוי,
// בלי חשיבות לסדר ולכתיב (0.9·0.2 = 20%·9/10). התרגיל נפתח לסכום של מכפלות, כך ש-1−(a+b) = 1−a−b.
(function () {
  const EPS = 1e-9;

  // מפרקים לאסימונים: מספרים (כולל שבר a/b ואחוז), פעולות, סוגריים
  function tokens(str) {
    const s = String(str || '').trim()
      .replace(/[−–—]/g, '-')
      .replace(/[·∙⋅•×xX*]/g, '*')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/\s+/g, '');
    const out = [];
    let i = 0;
    while (i < s.length) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(\/(\d+\.?\d*|\.\d+))?(%)?/);
      if (m) {
        let v = parseFloat(m[1]);
        if (m[3] !== undefined) v = v / parseFloat(m[3]);
        if (m[4]) v = v / 100;
        if (!isFinite(v)) return null;
        out.push({ n: v });
        i += m[0].length;
      } else if ('+-*()'.includes(s[i])) {
        out.push({ op: s[i] });
        i++;
      } else return null;
    }
    return out;
  }

  // מנתחים ומרחיבים לסכום של מכפלות: [{ k: 'מפתח המכפלה', c: מקדם }]
  // גורם 1 לא נספר (1·a = a), כך ש"1" לבד הוא מכפלה ריקה.
  function expand(str) {
    const t = tokens(str);
    if (!t || !t.length) return null;
    let p = 0;
    const peek = () => t[p], eat = op => (t[p] && t[p].op === op) ? (p++, true) : false;
    // איבר = רשימה של {f: [גורמים], c: מקדם}
    const mul = (A, B) => {
      const out = [];
      A.forEach(a => B.forEach(b => out.push({ f: a.f.concat(b.f), c: a.c * b.c })));
      return out;
    };
    function factor() {
      if (eat('-')) return factor().map(x => ({ f: x.f, c: -x.c }));
      if (eat('(')) {
        const e = sum();
        if (!e || !eat(')')) throw 0;
        return e;
      }
      const tk = peek();
      if (!tk || tk.n === undefined) throw 0;
      p++;
      return [{ f: Math.abs(tk.n - 1) < EPS ? [] : [tk.n], c: 1 }];
    }
    function product() {
      let e = factor();
      // כפל מפורש, או סוגריים צמודים: 2(…)
      while (peek() && (peek().op === '*' || peek().op === '(')) {
        eat('*');
        e = mul(e, factor());
      }
      return e;
    }
    function sum() {
      let e = product();
      while (peek() && (peek().op === '+' || peek().op === '-')) {
        const neg = t[p++].op === '-';
        e = e.concat(product().map(x => ({ f: x.f, c: neg ? -x.c : x.c })));
      }
      return e;
    }
    let terms;
    try {
      terms = sum();
      if (p !== t.length) return null;
    } catch (e) {
      return null;
    }
    // מאחדים מכפלות זהות
    const map = {};
    let value = 0;
    terms.forEach(x => {
      const k = x.f.map(v => v.toFixed(9)).sort().join('|');
      map[k] = (map[k] || 0) + x.c;
      value += x.c * x.f.reduce((a, b) => a * b, 1);
    });
    Object.keys(map).forEach(k => { if (Math.abs(map[k]) < EPS) delete map[k]; });
    return { map, value, ops: t.some(x => x.op === '*' || x.op === '+' || x.op === '-') };
  }

  const sameMap = (a, b) => {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => b[k] !== undefined && Math.abs(a[k] - b[k]) < EPS);
  };

  // הערך של תשובה מספרית (או של תרגיל שנכתב בתיבת התוצאה)
  function value(v) {
    const e = expand(v);
    return e ? e.value : null;
  }

  // תוצאה: שווה בערכה, עם מרווח לעיגול (0.333 = 1/3)
  function resultOk(v, want, tol) {
    const x = value(v), w = value(want);
    return x !== null && w !== null && Math.abs(x - w) <= (tol || 0.0015);
  }

  // גרסאות של תרגיל שבהן חלק מהמכפלות כבר חושבו (תוצאה מסעיף קודם): 0.63+0.07+0.27, ‏1−0.03.
  // נשארים לפחות שני איברים – אחרת זו רק התוצאה.
  function collapsed(e) {
    const keys = Object.keys(e.map), out = [e];
    if (keys.length > 6) return out;
    for (let mask = 1; mask < (1 << keys.length); mask++) {
      const map = {};
      keys.forEach((k, i) => {
        // רק מכפלה של כמה גורמים אפשר "לחשב מראש"
        const nk = mask & (1 << i) && k.includes('|') ? k.split('|').reduce((a, b) => a * parseFloat(b), 1).toFixed(9) : k;
        map[nk] = (map[nk] || 0) + e.map[k];
      });
      if (Object.keys(map).length >= 2) out.push({ map, value: e.value });
    }
    return out;
  }

  // תרגיל: '' = נכון; אחרת – מה לא בסדר. wants = התרגילים שמתקבלים (למשל ישיר + משלים)
  function exprProblem(v, wants) {
    const e = expand(v);
    if (!String(v || '').trim()) return 'empty';
    if (!e) return 'syntax';
    const list = [].concat(...[].concat(wants).map(expand).filter(Boolean).map(collapsed));
    if (list.some(w => sameMap(e.map, w.map))) return '';
    if (list.some(w => Math.abs(e.value - w.value) < 0.0005)) return e.ops ? 'other-way' : 'only-result';
    return 'wrong';
  }

  window.ProbCheck = { value, resultOk, exprProblem, expand };
})();
