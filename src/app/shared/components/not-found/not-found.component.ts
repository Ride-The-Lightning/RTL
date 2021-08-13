import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  public faTimes = faTimes;

  constructor(public router: Router) {}

  goToHelp(): void {
    this.router.navigate(['/help']);
  }

}
