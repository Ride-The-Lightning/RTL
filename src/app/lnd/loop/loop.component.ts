import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'rtl-loop',
  templateUrl: './loop.component.html',
  styleUrls: ['./loop.component.scss']
})
export class LoopComponent implements OnInit, OnDestroy {
  faCircleNotch = faCircleNotch;
  loopMonitorLogs = [];
  sub: Subscription;

  constructor(private socketService: SocketService) { }

  ngOnInit() {}

  onStartMonitor() {
    this.sub = this.socketService.startLoopMonitor().subscribe(log => {
      this.loopMonitorLogs.push(log);
      console.warn(log);
    });
  }

  onStopMonitor() {
    this.socketService.stopLoopMonitor();
    this.sub.unsubscribe();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
