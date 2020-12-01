import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  public faChartBar = faChartBar;
  public links = ['fees', 'payments'];
  public activeLink = this.links[0];

  constructor(private router: Router) {}

  ngOnInit() {
    this.activeLink = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
  }

}
