import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';
type Answer = { text: string; img?: string; icon?: string; isCorrect?: boolean };
type Question = {
  question: string;
  category: string;
  img?: string;
  answers: Answer[];
};

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class Quiz {
  // ------- THEME -------
  theme: Theme = (localStorage.getItem('theme') as Theme)
    ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  constructor() {
    this.applyTheme();
    this.buildCategories();
    this.prepareSession(); // byg første session (Alle + shuffle)
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }
  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  // ------- DATA -------
  // Kildedata (ikke-shufflede)
  questionsSource: Question[] = [
    // PROGRAMMERING
    {
      category: 'Programmering',
      question: 'Hvad står HTML for?',
      img: 'assets/html.png',
      answers: [
        { text: 'Hyper Text Markup Language', isCorrect: true, icon: '✅' },
        { text: 'HighText Machine Language',  icon: '⚙️'  },
        { text: 'Home Tool Markup Language',  icon: '🏠'  },
      ],
    },
    {
      category: 'Programmering',
      question: 'Vælg JavaScript-logoet',
      answers: [
        { text: 'JS',    img: 'assets/js.png',  isCorrect: true },
        { text: 'HTML',  img: 'assets/html.png' },
        { text: 'Random kat', img: 'assets/cat.jpg' }
      ],
    },

    // FILM
    {
      category: 'Film',
      question: 'Hvem instruerede “Inception”?',
      answers: [
        { text: 'Christopher Nolan', isCorrect: true },
        { text: 'Steven Spielberg' },
        { text: 'James Cameron' },
      ],
    },
    {
      category: 'Film',
      question: 'Hvilket år udkom den første “Star Wars”-film?',
      answers: [
        { text: '1977', isCorrect: true },
        { text: '1983' },
        { text: '1975' },
      ],
    },

    // HISTORIE
    {
      category: 'Historie',
      question: 'Hvor lå den antikke by Pompeji?',
      answers: [
        { text: 'Italien', isCorrect: true },
        { text: 'Grækenland' },
        { text: 'Spanien' },
      ],
    },
    {
      category: 'Historie',
      question: 'Hvilken civilisation byggede Machu Picchu?',
      answers: [
        { text: 'Inkaerne', isCorrect: true },
        { text: 'Mayaerne' },
        { text: 'Aztekerne' },
      ],
    },
  ];

  // ------- STATE -------
  // Kategorier
  categories: string[] = [];         // udfyldes dynamisk
  selectedCategory: string = 'Alle'; // aktivt valg

  // Session (den filtrerede og shufflede kopi vi spiller på)
  private session: Question[] = [];

  // UI/flow
  currentQuestionIndex = 0;
  selectedIndex: number | null = null;
  answered = false;
  score = 0;
  fade = true;

  // ------- DERIVED GETTERS -------
  get q() { return this.session[this.currentQuestionIndex]; }
  get total() { return this.session.length; }
  get progressPct() { return this.total ? Math.round((this.currentQuestionIndex / this.total) * 100) : 0; }
  get isLast() { return this.currentQuestionIndex >= this.total - 1; }
  get finished() { return this.total > 0 && this.isLast && this.answered; }
  get correctAnswerText(): string {
    return this.q?.answers.find(a => a.isCorrect)?.text ?? '';
  }

  // ------- CATEGORY / SESSION BYGGER -------
  private buildCategories() {
    const set = new Set<string>(this.questionsSource.map(q => q.category));
    this.categories = ['Alle', ...Array.from(set).sort()];
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private prepareSession() {
    // 1) filtrer på kategori
    const filtered = this.selectedCategory === 'Alle'
      ? this.questionsSource
      : this.questionsSource.filter(q => q.category === this.selectedCategory);

    // 2) dyb kopi, shuffle svar per spørgsmål, og shuffle spørgsmål
    const copy = this.deepCopy<Question[]>(filtered);
    for (const q of copy) q.answers = this.shuffle(q.answers);
    this.session = this.shuffle(copy);

    // 3) nulstil flow
    this.currentQuestionIndex = 0;
    this.selectedIndex = null;
    this.answered = false;
    this.score = 0;
    this.fade = true;
  }

  setCategory(cat: string) {
    if (this.selectedCategory === cat) return;
    this.selectedCategory = cat;
    this.prepareSession();
  }

  // ------- FLOW -------
  selectAnswer(i: number) {
    if (this.answered || !this.q) return;
    this.selectedIndex = i;
    this.answered = true;
    if (this.q.answers[i]?.isCorrect) this.score++;

    if (this.isLast) setTimeout(() => this.confetti(), 200);
  }

  nextQuestion() {
    if (this.isLast) return;
    this.fade = false;
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.selectedIndex = null;
      this.answered = false;
      this.fade = true;
    }, 80);
  }

  restart() {
    this.prepareSession(); // samme kategori, ny shuffle
  }

  // ------- KONFETTI -------
  private async confetti() {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 600;
    const colors = ['#4f46e5', '#9333ea', '#22c55e', '#f59e0b'];
    (function frame() {
      confetti({ particleCount: 6, angle: 60,  spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
}
