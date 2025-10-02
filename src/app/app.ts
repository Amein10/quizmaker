import { Component } from '@angular/core';
import { Quiz } from './quiz/quiz';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Quiz],           // ✅ register the Quiz component here
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {}
