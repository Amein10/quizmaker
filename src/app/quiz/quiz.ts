import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';
type Answer = { text: string; img?: string; icon?: string; isCorrect?: boolean };

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
  fade = true;

  questions: {
    question: string;
    img?: string;
    answers: Answer[];
  }[] = [
    {
      question: 'Hvad står HTML for?',
      answers: [
        { text: 'Hyper Text Markup Language', isCorrect: true },
        { text: 'HighText Machine Language', isCorrect: false },
        { text: 'Home Tool Markup Language', isCorrect: false }
      ]
    },
    {
      question: 'Hvilket år blev JavaScript introduceret?',
      answers: [
        { text: '1993', isCorrect: false },
        { text: '1995', isCorrect: true },
        { text: '1997', isCorrect: false }
      ]
    }
  ];

  get q() { return this.questions[this.currentQuestionIndex]; }
  get progressPct() { return Math.round((this.currentQuestionIndex / this.questions.length) * 100); }
  get isLast() { return this.currentQuestionIndex === this.questions.length - 1; }
  get finished() { return this.isLast && this.answered; }
  get total() { return this.questions.length; }

  // 🔑 DEN MANGLEDE GETTER
  get correctAnswerText(): string {
    const a = this.q?.answers?.find(ans => ans.isCorrect);
    return a ? a.text : '';
  }

  selectAnswer(i: number) {
    if (this.answered) return;
    this.selectedIndex = i;
    this.answered = true;
    if (this.q.answers[i].isCorrect) this.score++;

    if (this.isLast) {
      setTimeout(() => this.confetti(), 200);
    }
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
    this.currentQuestionIndex = 0;
    this.selectedIndex = null;
    this.answered = false;
    this.score = 0;
    this.fade = true;
  }

  // 🎉 konfetti
  private async confetti() {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 600;
    const colors = ['#4f46e5', '#9333ea', '#22c55e', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
}
