import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent implements OnInit, OnDestroy {
  public faDownload = faDownload;
  public links = [{link: 'backup', name: 'Backup'}, {link: 'restore', name: 'Restore'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router) {}

  ngOnInit() {
    this.activeLink = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
