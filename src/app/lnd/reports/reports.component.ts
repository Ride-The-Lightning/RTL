import { Component } from '@angular/core';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  public faChartBar = faChartBar;

  constructor() {}

}
