import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'rtl-error',
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {
  error = {errorCode: '', errorMessage: ''};
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.paramMap
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe(data => {
      this.error = window.history.state;
    });
  }

}
