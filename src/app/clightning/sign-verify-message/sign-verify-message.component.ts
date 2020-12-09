import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-cl-sign-verify-message',
  templateUrl: './sign-verify-message.component.html',
  styleUrls: ['./sign-verify-message.component.scss']
})
export class CLSignVerifyMessageComponent implements OnInit, OnDestroy {
  public faUserCheck = faUserCheck;
  public links = [{link: 'sign', name: 'Sign'}, {link: 'verify', name: 'Verify'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
