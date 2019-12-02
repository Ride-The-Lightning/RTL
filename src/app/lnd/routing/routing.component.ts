import { Component, OnInit } from '@angular/core';
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'rtl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent implements OnInit {
  faProjectDiagram = faProjectDiagram;

  constructor() {}

  ngOnInit() {}

}
