import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,   // vigtigt i Angular 17+
  imports: [CommonModule],  // her importerer vi NgFor og NgIf
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class Quiz {
  currentQuestionIndex = 0;
  selectedAnswer: string | null = null;
  showResult = false;

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

  selectAnswer(answer: string) {
    this.selectedAnswer = answer;
    this.showResult = true;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.selectedAnswer = null;
    this.showResult = false;
  }
}
