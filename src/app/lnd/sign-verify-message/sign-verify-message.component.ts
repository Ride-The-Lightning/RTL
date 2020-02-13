import { Component } from '@angular/core';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-sign-verify-message',
  templateUrl: './sign-verify-message.component.html',
  styleUrls: ['./sign-verify-message.component.scss']
})
export class SignVerifyMessageComponent {
  public faUserCheck = faUserCheck;

  constructor() {}

}
