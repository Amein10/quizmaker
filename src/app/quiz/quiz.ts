import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Theme = 'light' | 'dark';
type Difficulty = 'Let' | 'Middel' | 'Svær';

type Answer = { text: string; img?: string; icon?: string; isCorrect?: boolean; };
type Question = { question: string; category: string; difficulty: Difficulty; img?: string; answers: Answer[]; correctIndex: number; };
type SummaryRow = { q: string; answers: Answer[]; correctIndex: number; selectedIndex: number | null; wasCorrect: boolean; };
type ScoreEntry = { name: string; category: string; difficulty: Difficulty; score: number; total: number; percent: number; dateISO: string; };

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class Quiz implements OnDestroy {
  Math = Math;

  theme: Theme =
    (localStorage.getItem('theme') as Theme) ??
    (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

constructor() {
  this.applyTheme();
  this.loadPersisted();
  this.loadQuizzes(); // ⬅️ tilføj denne
}

// ---------- Håndtering af quiz-sæt ----------

loadQuizzes() {
  const txt = localStorage.getItem('qm_quizzes');
  this.quizzes = txt ? JSON.parse(txt) : [
    {
      name: 'Standardquiz',
      questions: this.masterQuestions
    }
  ];
}

saveQuizzes() {
  localStorage.setItem('qm_quizzes', JSON.stringify(this.quizzes));
}

selectQuiz(qz: { name: string; questions: Question[] }) {
  if (!qz.questions.length) {
    alert(`Quizzen "${qz.name}" har ingen spørgsmål endnu.`);
    return;
  }

  this.selectedQuiz = qz;
  this.masterQuestions = qz.questions;
  this.applyFilters();
}

createQuiz() {
  const name = this.quizName.trim();
  if (!name) return alert('Skriv et quiznavn først!');
  const exists = this.quizzes.some(q => q.name.toLowerCase() === name.toLowerCase());
  if (exists) return alert('En quiz med dette navn findes allerede.');

  const newSet = { name, questions: [] as Question[] };
  this.quizzes.push(newSet);
  this.saveQuizzes();
  this.quizName = '';
}

deleteQuiz(qz: { name: string }) {
  if (!confirm(`Er du sikker på, at du vil slette quizzen "${qz.name}"?`)) return;

  this.quizzes = this.quizzes.filter(q => q.name !== qz.name);
  this.saveQuizzes();

  if (this.selectedQuiz?.name === qz.name) {
    this.selectedQuiz = null;
    this.questions = [];
  }
}


exportQuizzes() {
  const blob = new Blob([JSON.stringify(this.quizzes, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'quizzes.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async importQuizzes(event: any) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      this.quizzes = data;
      this.saveQuizzes();
      alert('Quizzer importeret!');
    } else {
      alert('Ugyldig quiz-fil.');
    }
  } catch {
    alert('Fejl ved indlæsning af fil.');
  }
}

  toggleTheme() { this.theme = this.theme === 'dark' ? 'light' : 'dark'; this.applyTheme(); }
  private applyTheme() {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  playerName = localStorage.getItem('playerName') || '';
  onNameChange(v: string) { this.playerName = v.trim(); localStorage.setItem('playerName', this.playerName); }

  // ---------- Quiz-sæt ----------
quizzes: { name: string; questions: Question[] }[] = [];
selectedQuiz: { name: string; questions: Question[] } | null = null;
quizName = '';


  categories = ['Programmering', 'Film', 'Historie'];
  difficulties: Difficulty[] = ['Let', 'Middel', 'Svær'];
  selectedCategory = this.categories[0];
  selectedDifficulty: Difficulty = 'Let';
  setCategory(c: string) { this.selectedCategory = c; this.applyFilters(); }
  setDifficulty(d: Difficulty) { this.selectedDifficulty = d; this.applyFilters(); }

  private masterQuestions: Question[] = [
    { question: 'Hvad står HTML for?', category: 'Programmering', difficulty: 'Let',
      answers: [{ text: 'Hyper Text Markup Language', isCorrect: true }, { text: 'HighText Machine Language' }, { text: 'Home Tool Markup Language' }],
      correctIndex: 0 },
    { question: 'Hvilket år blev JavaScript introduceret?', category: 'Programmering', difficulty: 'Middel',
      answers: [{ text: '1993' }, { text: '1995', isCorrect: true }, { text: '1997' }],
      correctIndex: 1 }
  ];

  questions: Question[] = [];
  get total() { return this.questions.length; }
  get q() { return this.questions[this.currentQuestionIndex]; }

  currentQuestionIndex = 0;
  selectedIndex: number | null = null;
  answered = false;
  score = 0;
  fade = true;

  timerPerQuestion = 20;
  timeLeft = this.timerPerQuestion;
  private timerHandle: any = null;
  private deadlineMs = 0;
  private hasLoggedForQuestion = false;

  summary: SummaryRow[] = [];
  runTimes: number[] = [];
  correctMap: boolean[] = [];

  highscores: ScoreEntry[] = [];
  history: ScoreEntry[] = [];

  showBuilder = false;
  newQ: { question: string; category: string; difficulty: Difficulty; img: string; answers: { text: string; isCorrect: boolean }[] } = {
    question: '', category: '', difficulty: 'Let', img: '',
    answers: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
  };

  addAnswer() { this.newQ.answers.push({ text: '', isCorrect: false }); }
  removeAnswer(i: number) { if (this.newQ.answers.length > 2) this.newQ.answers.splice(i, 1); }
  setCorrect(i: number) { this.newQ.answers = this.newQ.answers.map((a, idx) => ({ ...a, isCorrect: idx === i })); }

  saveNewQuestion() {
    const trimmed = this.newQ.answers.map(a => ({ ...a, text: a.text.trim() })).filter(a => a.text.length);
    if (!this.newQ.question.trim() || trimmed.length < 2) return;
    const ci = trimmed.findIndex(a => a.isCorrect); if (ci < 0) return;

    const q: Question = {
      question: this.newQ.question.trim(),
      category: (this.newQ.category || 'Ukategoriseret').trim(),
      difficulty: this.newQ.difficulty,
      img: this.newQ.img.trim() || undefined,
      answers: trimmed.map(a => ({ text: a.text, isCorrect: a.isCorrect })),
      correctIndex: ci
    };
    this.masterQuestions.push(q);
    if (q.category && !this.categories.includes(q.category)) this.categories.push(q.category);

    this.newQ = { question: '', category: '', difficulty: 'Let', img: '', answers: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] };
    this.applyFilters(); this.showBuilder = false;
  }

  get isLast() { return this.currentQuestionIndex === this.total - 1; }
  get finished() { return this.total > 0 && this.isLast && this.answered; }
  get progressPct() { const answeredCount = this.currentQuestionIndex + (this.answered ? 1 : 0); return this.total ? Math.round((answeredCount / this.total) * 100) : 0; }
  get timePct() { return this.timerPerQuestion ? Math.max(0, Math.min(100, (this.timeLeft / this.timerPerQuestion) * 100)) : 0; }
  get correctAnswerText() { return this.q?.answers[this.q.correctIndex]?.text ?? ''; }
  get percentScore() { return this.total ? Math.round((this.score / this.total) * 100) : 0; }

  private startTimer() {
    this.clearTimer();
    this.timeLeft = this.timerPerQuestion;
    this.deadlineMs = Date.now() + this.timerPerQuestion * 1000;
    this.hasLoggedForQuestion = false;

    const tick = () => {
      const msLeft = Math.max(0, this.deadlineMs - Date.now());
      this.timeLeft = Math.ceil(msLeft / 1000);
      if (msLeft <= 0) return this.handleTimeout();
      this.timerHandle = setTimeout(tick, 200);
    };
    tick();
  }
  private clearTimer() { if (this.timerHandle) clearTimeout(this.timerHandle); this.timerHandle = null; }

  private logRunTimeOnce(kind: 'select' | 'timeout') {
    if (this.hasLoggedForQuestion) return;
    this.hasLoggedForQuestion = true;
    const elapsedMs = this.timerPerQuestion * 1000 - Math.max(0, this.deadlineMs - Date.now());
    const used = kind === 'timeout' ? this.timerPerQuestion : Math.min(this.timerPerQuestion, Math.max(0, Math.round(elapsedMs / 1000)));
    this.runTimes.push(used);
  }

  selectAnswer(i: number) {
    if (this.answered) return;
    this.selectedIndex = i; this.answered = true; this.logRunTimeOnce('select'); this.clearTimer();
    const ok = i === this.q.correctIndex; this.correctMap.push(ok); if (ok) this.score++;
    this.appendSummaryRow();
    this.isLast ? setTimeout(() => this.finishAndCelebrate(), 150) : setTimeout(() => this.nextBtn?.nativeElement?.focus(), 0);
  }

  private handleTimeout() {
    if (this.answered) return;
    this.selectedIndex = null; this.answered = true; this.logRunTimeOnce('timeout'); this.correctMap.push(false); this.appendSummaryRow(); this.clearTimer();
  }

  nextQuestion() {
    if (this.isLast) return;
    this.fade = false;
    setTimeout(() => { this.currentQuestionIndex++; this.selectedIndex = null; this.answered = false; this.fade = true; this.startTimer(); }, 80);
  }

  restart() {
    this.currentQuestionIndex = 0; this.selectedIndex = null; this.answered = false; this.score = 0; this.fade = true;
    this.summary = []; this.runTimes = []; this.correctMap = []; this.hasLoggedForQuestion = false;
    this.clearTimer(); if (this.total > 0) this.startTimer();
  }

  private appendSummaryRow() {
    this.summary.push({
      q: this.q.question,
      answers: this.q.answers,
      correctIndex: this.q.correctIndex,
      selectedIndex: this.selectedIndex,
      wasCorrect: this.selectedIndex !== null && this.selectedIndex === this.q.correctIndex
    });
  }

  private async finishAndCelebrate() { this.persistResult(); try { await this.confetti(); } catch {} }

  private loadPersisted() {
    this.loadHighscores();
    const hist = localStorage.getItem('qm_history');
    this.history = hist ? JSON.parse(hist) as ScoreEntry[] : [];
  }

  private hsKey(cat: string, diff: Difficulty) {
    const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    return `qm_highscores_${slug(cat)}_${slug(diff)}`;
  }
  private loadHighscores() {
    const txt = localStorage.getItem(this.hsKey(this.selectedCategory, this.selectedDifficulty));
    this.highscores = txt ? JSON.parse(txt) as ScoreEntry[] : [];
  }
  private saveHighscores() {
    localStorage.setItem(this.hsKey(this.selectedCategory, this.selectedDifficulty), JSON.stringify(this.highscores));
  }

  private persistResult() {
    if (!this.total) return;
    const entry: ScoreEntry = {
      name: this.playerName || 'Anonym',
      category: this.selectedCategory,
      difficulty: this.selectedDifficulty,
      score: this.score,
      total: this.total,
      percent: this.percentScore,
      dateISO: new Date().toISOString()
    };
    this.highscores.push(entry);
    this.highscores.sort((a, b) => b.percent - a.percent || b.score - a.score || b.dateISO.localeCompare(a.dateISO));
    this.highscores = this.highscores.slice(0, 10);
    this.saveHighscores();

    this.history.unshift(entry);
    this.history = this.history.slice(0, 25);
    localStorage.setItem('qm_history', JSON.stringify(this.history));
  }

  clearHighscores() { this.highscores = []; this.saveHighscores(); }
  clearHistory() { this.history = []; localStorage.setItem('qm_history', JSON.stringify(this.history)); }

  private applyFilters() {
    this.loadHighscores();
    this.questions = this.masterQuestions
      .filter(q => q.category === this.selectedCategory && q.difficulty === this.selectedDifficulty)
      .map(q => this.shuffleAnswers(q));
    this.restart();
    if (this.total > 0) this.startTimer();
  }

  private shuffleAnswers(q: Question): Question {
    const idxs = q.answers.map((_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idxs[i], idxs[j]] = [idxs[j], idxs[i]]; }
    return { ...q, answers: idxs.map(i => q.answers[i]), correctIndex: idxs.indexOf(q.correctIndex) };
  }

  private async confetti() {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 600, colors = ['#4f46e5', '#9333ea', '#22c55e', '#f59e0b'];
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  @ViewChild('nextBtn') nextBtn?: ElementRef<HTMLButtonElement>;
  trackAnswer = (_: number, a: Answer) => a.text;
  trackCategory = (_: number, c: string) => c;
  trackDifficulty = (_: number, d: Difficulty) => d;

  ngOnDestroy() { this.clearTimer(); }
}
