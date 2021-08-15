import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-error',
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {
  error = {errorCode: '', errorMessage: ''};
  public faTimes = faTimes;
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private activatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.activatedRoute.paramMap.
    pipe(takeUntil(this.unsubs[0])).
    subscribe(data => {
      this.error = window.history.state;
    });
  }

  goToHelp(): void {
    this.router.navigate(['/help']);
  }

}
