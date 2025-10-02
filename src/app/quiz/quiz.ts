import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class Quiz {
  // ----- THEME -----
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

  // ----- QUIZ -----
  currentQuestionIndex = 0;
  selectedAnswer: string | null = null;
  answered = false;
  score = 0;

  questions = [
    { question: 'Hvad står HTML for?',
      answers: ['Hyper Text Markup Language','HighText Machine Language','Home Tool Markup Language'],
      correct: 'Hyper Text Markup Language' },
    { question: 'Hvilket år blev JavaScript introduceret?',
      answers: ['1993','1995','1997'],
      correct: '1995' }
  ];

  get q() { return this.questions[this.currentQuestionIndex]; }
  get progressPct() { return Math.round((this.currentQuestionIndex / this.questions.length) * 100); }
  get isLast() { return this.currentQuestionIndex === this.questions.length - 1; }

  selectAnswer(a: string) { if (this.answered) return; this.selectedAnswer = a; this.answered = true; if (a === this.q.correct) this.score++; }
  nextQuestion() { if (!this.isLast) { this.currentQuestionIndex++; this.selectedAnswer = null; this.answered = false; } }
  restart() { this.currentQuestionIndex = 0; this.selectedAnswer = null; this.answered = false; this.score = 0; }
}
