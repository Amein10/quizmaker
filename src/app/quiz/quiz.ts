import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';
type Answer = { text: string; img?: string; icon?: string };

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

  constructor() { this.applyTheme(); }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }
  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  // ------- QUIZ -------
  currentQuestionIndex = 0;
  selectedIndex: number | null = null;
  answered = false;
  score = 0;

  // bruges til fade-animation ved sideskift
  fade = true;

  // 🔽 EKSEMPEL: billede på spørgsmål + billeder/ikoner i svar
  questions: {
    question: string;
    img?: string;             // valgfrit billede til spørgsmålet
    answers: Answer[];        // svar kan have text + img eller icon
    correctIndex: number;
  }[] = [
    {
      question: 'Hvad står HTML for?',
      img: 'assets/html.png',
      answers: [
        { text: 'Hyper Text Markup Language', icon: '✅' },
        { text: 'HighText Machine Language',  icon: '⚙️'  },
        { text: 'Home Tool Markup Language',  icon: '🏠'  },
      ],
      correctIndex: 0
    },
    {
      question: 'Vælg JavaScript-logoet',
      answers: [
        { text: 'JS',          img: 'assets/js.png'   },
        { text: 'HTML',        img: 'assets/html.png' },
        { text: 'Random kat',  img: 'assets/cat.jpg'  }
      ],
      correctIndex: 0
    }
  ];

  get q() { return this.questions[this.currentQuestionIndex]; }
  get progressPct() { return Math.round((this.currentQuestionIndex / this.questions.length) * 100); }
  get isLast() { return this.currentQuestionIndex === this.questions.length - 1; }
  get finished() { return this.isLast && this.answered; }

  selectAnswer(i: number) {
    if (this.answered) return;
    this.selectedIndex = i;
    this.answered = true;
    if (i === this.q.correctIndex) this.score++;

    // sidste spørgsmål besvaret -> konfetti 🎉
    if (this.isLast) setTimeout(() => this.confetti(), 200);
  }

  nextQuestion() {
    if (this.isLast) return;
    // lille fade-ud, skift spørgsmål, fade-ind
    this.fade = false;
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.selectedIndex = null;
      this.answered = false;
      this.fade = true;
    }, 80);
  }

  restart() {
    this.currentQuestionIndex = 0;
    this.selectedIndex = null;
    this.answered = false;
    this.score = 0;
    this.fade = true;
  }

  // dynamisk import af confetti for mindre bundle
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
