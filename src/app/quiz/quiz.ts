import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class Quiz {
  currentQuestionIndex = 0;
  selectedAnswer: string | null = null;
  answered = false;
  score = 0;

  questions = [
    {
      question: 'Hvad står HTML for?',
      answers: ['Hyper Text Markup Language', 'HighText Machine Language', 'Home Tool Markup Language'],
      correct: 'Hyper Text Markup Language'
    },
    {
      question: 'Hvilket år blev JavaScript introduceret?',
      answers: ['1993', '1995', '1997'],
      correct: '1995'
    }
  ];

  get q() { return this.questions[this.currentQuestionIndex]; }
  get progressPct() { return Math.round(((this.currentQuestionIndex) / this.questions.length) * 100); }
  get isLast() { return this.currentQuestionIndex === this.questions.length - 1; }

  selectAnswer(answer: string) {
    if (this.answered) return;
    this.selectedAnswer = answer;
    this.answered = true;
    if (answer === this.q.correct) this.score++;
  }

  nextQuestion() {
    if (!this.isLast) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.answered = false;
    }
  }

  restart() {
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.answered = false;
    this.score = 0;
  }
}
