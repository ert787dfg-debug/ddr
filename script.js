let state = {
  questions: [],
  idx: 0,
  score: 0,
  lang: 'en',
  reviewMode: false,
  wrongList: [],
  reviewQueue: [],
  reviewIdx: 0
};

const els = {
  start: document.getElementById('startBtn'),
  retry: document.getElementById('retryBtn'),
  reviewBtn: document.getElementById('reviewBtn'),
  reviewCount: document.getElementById('reviewCount'),
  lang: document.getElementById('langToggle'),
  theme: document.getElementById('themeToggle'),
  progress: document.getElementById('progress'),
  score: document.getElementById('score'),
  qText: document.getElementById('questionText'),
  options: document.getElementById('options'),
  feedback: document.getElementById('feedback'),
  imgWrap: document.getElementById('imageWrap'),
  img: document.getElementById('qImage'),
  imgCap: document.getElementById('imgCaption'),
  modeLabel: document.querySelector('.modeLabel')
};

const THEMES = ['sky-day','sky-night','red-day','red-night'];

function setTheme(next) {
  const root = document.documentElement;
  const curr = root.getAttribute('data-theme') || THEMES[0];
  const idx = THEMES.indexOf(curr);
  const nextTheme = next || THEMES[(idx + 1) % THEMES.length];
  root.setAttribute('data-theme', nextTheme);
  const icon = nextTheme.includes('night') ? '☾' : '☀';
  const label = nextTheme.startsWith('sky') ? 'Sky' : 'Red';
  els.theme.textContent = `${label} ${icon}`;
}

function setLang(next) {
  state.lang = next || (state.lang === 'en' ? 'ar' : 'en');
  els.lang.textContent = state.lang === 'en' ? 'AR' : 'EN';
  renderQuestion();
}

function pickText(q, key) {
  const map = { text: ['text', 'text_ar'], choices: ['choices', 'choices_ar'], fb: ['feedback', 'feedback_ar'] };
  const [enKey, arKey] = map[key];
  return state.lang === 'en' ? q[enKey] : (q[arKey] ?? q[enKey]);
}

function safeArray(val) { return Array.isArray(val) ? val : []; }

function updateReviewBadge() {
  els.reviewCount.textContent = state.wrongList.length;
  els.reviewBtn.hidden = state.wrongList.length === 0;
}

function markWrongById(qid) {
  if (!state.wrongList.includes(qid)) state.wrongList.push(qid);
  updateReviewBadge();
}

function unmarkWrongById(qid) {
  state.wrongList = state.wrongList.filter(id => id !== qid);
  updateReviewBadge();
}

function enterReviewMode() {
  if (state.wrongList.length === 0) return;
  state.reviewMode = true;
  state.reviewQueue = state.wrongList.slice();
  state.reviewIdx = 0;
  state.modeLabel.textContent = state.lang === 'en' ? 'Review Mode' : 'وضع المراجعة';
  console.debug('enterReviewMode', { reviewQueue: state.reviewQueue, reviewIdx: state.reviewIdx });
  renderReviewQuestion();
}

function exitReviewMode() {
  state.reviewMode = false;
  state.reviewQueue = [];
  state.reviewIdx = 0;
  state.modeLabel.textContent = '';
  console.debug('exitReviewMode');
  renderQuestion();
}

function renderReviewQuestion() {
  if (!state.reviewMode) { renderQuestion(); return; }
  if (!Array.isArray(state.reviewQueue) || state.reviewQueue.length === 0) {
    exitReviewMode();
    return;
  }
  if (state.reviewIdx < 0) state.reviewIdx = 0;
  if (state.reviewIdx >= state.reviewQueue.length) state.reviewIdx = 0;

  const qid = state.reviewQueue[state.reviewIdx];
  const q = state.questions.find(x => x.id === qid);

  if (!q) {
    state.reviewQueue.splice(state.reviewIdx, 1);
    if (state.reviewQueue.length === 0) { exitReviewMode(); return; }
    if (state.reviewIdx >= state.reviewQueue.length) state.reviewIdx = 0;
    renderReviewQuestion();
    return;
  }

  const text = pickText(q, 'text');
  const choices = pickText(q, 'choices');

  els.progress.textContent = `${state.reviewIdx + 1} / ${state.reviewQueue.length}`;
  els.score.textContent = `${state.lang === 'en' ? 'Score' : 'الدرجة'}: ${state.score}`;
  els.qText.textContent = text || (state.lang === 'en' ? 'Missing text' : 'نص السؤال مفقود');

  if (q.image) {
    els.imgWrap.hidden = false;
    els.img.src = q.image;
    els.img.alt = text || 'Question image';
    els.imgCap.textContent = '';
  } else {
    els.imgWrap.hidden = true;
    els.img.src = '';
  }

  els.options.innerHTML = '';
  safeArray(choices).forEach((c, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.addEventListener('click', () => handleReviewAnswer(i));
    li.appendChild(btn);
    els.options.appendChild(li);
  });

  els.feedback.hidden = true;
  els.retry.hidden = true;
}

function renderQuestion() {
  if (state.reviewMode) { renderReviewQuestion(); return; }

  const qs = state.questions;
  if (!Array.isArray(qs) || qs.length === 0) {
    els.qText.textContent = state.lang === 'en' ? 'No questions loaded.' : 'لا توجد أسئلة محمّلة.';
    els.options.innerHTML = '';
    els.feedback.hidden = true;
    els.modeLabel.textContent = '';
    return;
  }

  if (state.idx < 0) state.idx = 0;
  if (state.idx >= qs.length) {
    els.qText.textContent = state.lang === 'en' ? `Finished! Score: ${state.score}/${qs.length}` : `انتهاء! الدرجة: ${state.score}/${qs.length}`;
    els.options.innerHTML = '';
    els.feedback.hidden = true;
    els.retry.hidden = false;
    els.modeLabel.textContent = '';
    return;
  }

  const q = qs[state.idx];
  const text = pickText(q, 'text');
  const choices = pickText(q, 'choices');

  els.progress.textContent = `${state.idx + 1} / ${qs.length}`;
  els.score.textContent = `${state.lang === 'en' ? 'Score' : 'الدرجة'}: ${state.score}`;
  els.qText.textContent = text || (state.lang === 'en' ? 'Missing text' : 'نص السؤال مفقود');

  if (q.image) {
    els.imgWrap.hidden = false;
    els.img.src = q.image;
    els.img.alt = text || 'Question image';
    els.imgCap.textContent = '';
  } else {
    els.imgWrap.hidden = true;
    els.img.src = '';
  }

  els.options.innerHTML = '';
  safeArray(choices).forEach((c, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = c;
    if (q.meta && q.meta.markedWrong) btn.classList.add('marked');
    btn.addEventListener('click', () => handleAnswer(i));
    li.appendChild(btn);
    els.options.appendChild(li);
  });

  els.feedback.hidden = true;
  els.retry.hidden = true;
  els.modeLabel.textContent = '';
}

function handleAnswer(i) {
  const q = state.questions[state.idx];
  if (!q) return;

  const correctIdx = Number(q.answer);
  const fb = pickText(q, 'fb') || {};
  const buttons = els.options.querySelectorAll('button');

  buttons.forEach((b, idx) => {
    b.disabled = true;
    b.classList.toggle('correct', idx === correctIdx);
    b.classList.toggle('wrong', idx !== correctIdx && idx === i);
  });

  const isCorrect = i === correctIdx;
  q.meta = q.meta || {};

  if (!isCorrect) {
    q.meta.markedWrong = true;
    q.meta.reviewAttempts = (q.meta.reviewAttempts || 0) + 1;
    markWrongById(q.id);
  } else {
    if (q.meta && q.meta.markedWrong) {
      q.meta.markedWrong = false;
      unmarkWrongById(q.id);
    }
    state.score++;
  }

  els.feedback.hidden = false;
  els.feedback.textContent = isCorrect ? (fb.correct || (state.lang === 'en' ? 'Correct.' : 'صحيح.')) : (fb.wrong || (state.lang === 'en' ? 'Wrong.' : 'خطأ.'));

  setTimeout(() => {
    state.idx++;
    if (state.idx >= state.questions.length) {
      renderQuestion();
      return;
    }
    renderQuestion();
  }, 700);
}

function handleReviewAnswer(i) {
  if (!Array.isArray(state.reviewQueue) || state.reviewQueue.length === 0) { exitReviewMode(); return; }

  const qid = state.reviewQueue[state.reviewIdx];
  const q = state.questions.find(x => x.id === qid);

  if (!q) {
    state.reviewQueue.splice(state.reviewIdx, 1);
    if (state.reviewQueue.length === 0) { exitReviewMode(); return; }
    if (state.reviewIdx >= state.reviewQueue.length) state.reviewIdx = 0;
    renderReviewQuestion();
    return;
  }

  const correctIdx = Number(q.answer);
  const fb = pickText(q, 'fb') || {};
  const buttons = els.options.querySelectorAll('button');

  buttons.forEach((b, idx) => {
    b.disabled = true;
    b.classList.toggle('correct', idx === correctIdx);
    b.classList.toggle('wrong', idx !== correctIdx && idx === i);
  });

  const isCorrect = i === correctIdx;
  q.meta = q.meta || {};
  q.meta.reviewAttempts = (q.meta.reviewAttempts || 0) + 1;

  if (isCorrect) {
    q.meta.markedWrong = false;
    unmarkWrongById(q.id);
    state.score++;
    els.feedback.hidden = false;
    els.feedback.textContent = fb.correct || (state.lang === 'en' ? 'Correct.' : 'صحيح.');

    setTimeout(() => {
      state.reviewQueue.splice(state.reviewIdx, 1);
      if (state.reviewQueue.length === 0) {
        exitReviewMode();
        return;
      }
      if (state.reviewIdx >= state.reviewQueue.length) state.reviewIdx = 0;
      renderReviewQuestion();
    }, 700);

  } else {
    q.meta.markedWrong = true;
    markWrongById(q.id);
    els.feedback.hidden = false;
    els.feedback.textContent = fb.wrong || (state.lang === 'en' ? 'Wrong.' : 'خطأ.');

    setTimeout(() => {
      if (state.reviewQueue.length === 0) { exitReviewMode(); return; }
      state.reviewIdx = (state.reviewIdx + 1) % state.reviewQueue.length;
      renderReviewQuestion();
    }, 700);
  }
}

function startQuiz() {
  state.idx = 0;
  state.score = 0;
  state.reviewMode = false;
  state.modeLabel.textContent = '';
  renderQuestion();
}

async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.questions;
    state.questions = safeArray(raw).map(q => ({
      id: q.id ?? (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random())),
      topic: q.topic,
      subject: q.subject,
      text: q.text ?? q.question,
      text_ar: q.text_ar ?? q.question_ar,
      choices: q.choices ?? q.options,
      choices_ar: q.choices_ar ?? q.options_ar,
      answer: q.answer ?? q.correctIndex,
      feedback: q.feedback,
      feedback_ar: q.feedback_ar,
      image: q.image ?? null,
      emoji: q.emoji ?? null,
      difficulty: q.difficulty ?? null,
      meta: q.meta ?? {}
    }));
    state.questions = state.questions.filter(q => q.text && Array.isArray(q.choices) && typeof q.answer === 'number');
    state.wrongList = state.questions.filter(q => q.meta && q.meta.markedWrong).map(q => q.id);
    updateReviewBadge();
    console.debug('questions loaded', { count: state.questions.length, wrongList: state.wrongList });
  } catch (err) {
    console.error('Failed to load questions:', err);
    els.qText.textContent = 'Failed to load questions.';
  }
}

els.start.addEventListener('click', startQuiz);
els.retry.addEventListener('click', () => { state.idx = 0; state.score = 0; renderQuestion(); });
els.reviewBtn.addEventListener('click', () => enterReviewMode());
els.lang.addEventListener('click', () => setLang());
els.theme.addEventListener('click', () => setTheme());

setTheme('sky-day');
setLang('en');
loadQuestions().then(() => renderQuestion());
