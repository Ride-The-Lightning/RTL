import { Component, OnInit } from '@angular/core';

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

  constructor() {}

  ngOnInit() {
    // this.helpTopics.push(new HelpTopic('Set LND home directory?',
    //   'Pass the directroy information while getting the server up with --lndir "local-lnd-path".<br>Example: node rtl --lndir C:\lnd\dir\path'));
    this.helpTopics.push(new HelpTopic('Change theme?', 'Click on rotating setting icon on the right side of the screen and choose from the given options.'));
  }

}
