import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'rtl-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {

  constructor(public router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

}
