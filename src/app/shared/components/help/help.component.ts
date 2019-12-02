import { Component, OnInit } from '@angular/core';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

export class HelpTopic {
  question: string;
  answer: string;

  constructor(ques: string, ans: string) {
    this.question = ques;
    this.answer = ans;
  }
}

@Component({
  selector: 'rtl-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  public helpTopics: Array<HelpTopic> = [];
  public faQuestion = faQuestion;

  constructor() {}

  ngOnInit() {
    this.helpTopics.push(new HelpTopic('Change setting?', 'Click on setting icon on the navigation and choose from the given options.'));
    // this.helpTopics.push(new HelpTopic('', ''));
  }

}
