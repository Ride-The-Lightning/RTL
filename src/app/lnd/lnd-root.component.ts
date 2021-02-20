import { Component } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { routeAnimation } from '../shared/animation/route-animation';

@Component({
  selector: 'rtl-lnd-root',
  templateUrl: './lnd-root.component.html',
  styleUrls: ['./lnd-root.component.scss'],
  animations: [routeAnimation]
})
export class LNDRootComponent {
  loading = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event: Event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.loading = true;
          break;
        }
        case event instanceof NavigationEnd:
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          this.loading = false;
          break;
        }
        default: {
          break;
        }
      }
    });    
  }
}
