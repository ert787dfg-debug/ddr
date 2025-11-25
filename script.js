let state = { questions: [], idx: 0, score: 0, lang: 'en' };
const els = {
  start: document.getElementById('startBtn'),
  retry: document.getElementById('retryBtn'),
  lang: document.getElementById('langToggle'),
  theme: document.getElementById('themeToggle'),
  progress: document.getElementById('progress'),
  score: document.getElementById('score'),
  qText: document.getElementById('questionText'),
  options: document.getElementById('options'),
  feedback: document.getElementById('feedback'),
  imgWrap: document.getElementById('imageWrap'),
  img: document.getElementById('qImage'),
  imgCap: document.getElementById('imgCaption')
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
function renderQuestion() {
  const qs = state.questions;
  if (!Array.isArray(qs) || qs.length === 0) {
    els.qText.textContent = state.lang === 'en' ? 'No questions loaded.' : 'لا توجد أسئلة محمّلة.';
    els.options.innerHTML = '';
    els.feedback.hidden = true;
    return;
  }
  if (state.idx < 0 || state.idx >= qs.length) {
    els.qText.textContent = state.lang === 'en' ? `Finished! Score: ${state.score}/${qs.length}` : `انتهاء! الدرجة: ${state.score}/${qs.length}`;
    els.options.innerHTML = '';
    els.feedback.hidden = true;
    els.retry.hidden = false;
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
    btn.addEventListener('click', () => handleAnswer(i));
    li.appendChild(btn);
    els.options.appendChild(li);
  });
  els.feedback.hidden = true;
  els.retry.hidden = true;
}
function handleAnswer(i) {
  const q = state.questions[state.idx];
  const correctIdx = Number(q.answer);
  const fb = pickText(q, 'fb') || {};
  const buttons = els.options.querySelectorAll('button');
  buttons.forEach((b, idx) => {
    b.disabled = true;
    b.classList.toggle('correct', idx === correctIdx);
    b.classList.toggle('wrong', idx !== correctIdx && idx === i);
  });
  const isCorrect = i === correctIdx;
  if (isCorrect) state.score++;
  els.feedback.hidden = false;
  els.feedback.textContent = isCorrect ? (fb.correct || (state.lang === 'en' ? 'Correct.' : 'صحيح.')) : (fb.wrong || (state.lang === 'en' ? 'Wrong.' : 'خطأ.'));
  setTimeout(() => {
    state.idx++;
    renderQuestion();
  }, 900);
}
function startQuiz() { state.idx = 0; state.score = 0; renderQuestion(); }
async function loadQuestions() {
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
    difficulty: q.difficulty ?? null
  }));
  state.questions = state.questions.filter(q => q.text && Array.isArray(q.choices) && typeof q.answer === 'number');
}
els.start.addEventListener('click', startQuiz);
els.retry.addEventListener('click', () => { state.idx = 0; state.score = 0; renderQuestion(); });
els.lang.addEventListener('click', () => setLang());
els.theme.addEventListener('click', () => setTheme());
setTheme('sky-day');
setLang('en');
loadQuestions().then(() => renderQuestion()).catch(e => {
  console.error('Failed to load questions:', e);
  els.qText.textContent = 'Failed to load questions.';
});
