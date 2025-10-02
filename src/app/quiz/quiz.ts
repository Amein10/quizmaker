import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';
type Difficulty = 'Let' | 'Middel' | 'Svær';

type Answer = {
  text: string;
  img?: string;
  icon?: string;
  isCorrect?: boolean;
};

type Question = {
  question: string;
  category: string;
  difficulty: Difficulty;
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
  // ------- TEMA -------
  theme: Theme = (localStorage.getItem('theme') as Theme)
    ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  constructor() {
    this.applyTheme();
    this.buildFilters();
    this.prepareSession(); // første session (Alle/Alle + shuffle)
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }
  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  // ------- KILDEDATA (ikke-shufflede) -------
  questionsSource: Question[] = [
    // PROGRAMMERING
    {
      category: 'Programmering',
      difficulty: 'Let',
      question: 'Hvad står HTML for?',
      img: 'assets/html.png',
      answers: [
        { text: 'Hyper Text Markup Language', isCorrect: true, icon: '✅' },
        { text: 'HighText Machine Language',  icon: '⚙️' },
        { text: 'Home Tool Markup Language',  icon: '🏠' }
      ]
    },
    {
      category: 'Programmering',
      difficulty: 'Middel',
      question: 'Vælg JavaScript-logoet',
      answers: [
        { text: 'JS',    img: 'assets/js.png',  isCorrect: true },
        { text: 'HTML',  img: 'assets/html.png' },
        { text: 'Random kat', img: 'assets/cat.jpg' }
      ]
    },
    {
      category: 'Programmering',
      difficulty: 'Svær',
      question: 'Hvad kalder man princippet “OCP” i OOP?',
      answers: [
        { text: 'Open/Closed Principle', isCorrect: true },
        { text: 'Object/Class Pattern' },
        { text: 'Overload/Compile Principle' }
      ]
    },

    // FILM
    {
      category: 'Film',
      difficulty: 'Let',
      question: 'Hvem instruerede “Inception”?',
      answers: [
        { text: 'Christopher Nolan', isCorrect: true },
        { text: 'Steven Spielberg' },
        { text: 'James Cameron' }
      ]
    },
    {
      category: 'Film',
      difficulty: 'Middel',
      question: 'Hvilket år udkom den første “Star Wars”-film?',
      answers: [
        { text: '1977', isCorrect: true },
        { text: '1983' },
        { text: '1975' }
      ]
    },

    // HISTORIE
    {
      category: 'Historie',
      difficulty: 'Let',
      question: 'Hvor lå den antikke by Pompeji?',
      answers: [
        { text: 'Italien', isCorrect: true },
        { text: 'Grækenland' },
        { text: 'Spanien' }
      ]
    },
    {
      category: 'Historie',
      difficulty: 'Middel',
      question: 'Hvilken civilisation byggede Machu Picchu?',
      answers: [
        { text: 'Inkaerne', isCorrect: true },
        { text: 'Mayaerne' },
        { text: 'Aztekerne' }
      ]
    },
    {
      category: 'Historie',
      difficulty: 'Svær',
      question: 'Hvem var den første romerske kejser?',
      answers: [
        { text: 'Augustus', isCorrect: true },
        { text: 'Julius Cæsar' },
        { text: 'Nero' }
      ]
    }
  ];

  // ------- FILTRE -------
  categories: string[] = [];                 // fx ["Alle", "Film", ...]
  difficulties: Array<'Alle' | Difficulty> = ['Alle', 'Let', 'Middel', 'Svær'];

  selectedCategory: string = 'Alle';
  selectedDifficulty: 'Alle' | Difficulty = 'Alle';

  private buildFilters() {
    const set = new Set<string>(this.questionsSource.map(q => q.category));
    this.categories = ['Alle', ...Array.from(set).sort()];
  }

  setCategory(cat: string) {
    if (this.selectedCategory === cat) return;
    this.selectedCategory = cat;
    this.prepareSession();
  }

  setDifficulty(diff: 'Alle' | Difficulty) {
    if (this.selectedDifficulty === diff) return;
    this.selectedDifficulty = diff;
    this.prepareSession();
  }

  // ------- SESSION (filtreret + shuffle) -------
  private session: Question[] = [];

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
    // 1) filtrér efter kategori + sværhedsgrad
    let filtered = this.questionsSource;
    if (this.selectedCategory !== 'Alle') {
      filtered = filtered.filter(q => q.category === this.selectedCategory);
    }
    if (this.selectedDifficulty !== 'Alle') {
      filtered = filtered.filter(q => q.difficulty === this.selectedDifficulty);
    }

    // 2) dyb kopi + shuffle svar i hvert spørgsmål + shuffle spørgsmål
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

  // ------- FLOW / UI -------
  currentQuestionIndex = 0;
  selectedIndex: number | null = null;
  answered = false;
  score = 0;
  fade = true;

  get q() { return this.session[this.currentQuestionIndex]; }
  get total() { return this.session.length; }
  get progressPct() { return this.total ? Math.round((this.currentQuestionIndex / this.total) * 100) : 0; }
  get isLast() { return this.currentQuestionIndex >= this.total - 1; }
  get finished() { return this.total > 0 && this.isLast && this.answered; }
  get correctAnswerText(): string {
    return this.q?.answers.find(a => a.isCorrect)?.text ?? '';
  }

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
    this.prepareSession(); // samme filtre, ny shuffle
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
