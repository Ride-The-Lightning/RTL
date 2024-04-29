import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateNodeSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../../store/rtl.selector';

@Component({
  selector: 'rtl-boltz-service-settings',
  templateUrl: './boltz-service-settings.component.html',
  styleUrls: ['./boltz-service-settings.component.scss']
})
export class BoltzServiceSettingsComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public faInfoCircle = faInfoCircle;
  public selNode: Node | any;
  public previousSelNode: Node | any;
  public enableBoltz = false;
  public serverUrl = '';
  public macaroonPath = '';
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableBoltz = !!(selNode.settings.boltzServerUrl && selNode.settings.boltzServerUrl.trim() !== '');
        this.serverUrl = this.selNode.settings.boltzServerUrl || '';
        this.macaroonPath = this.selNode.authentication.boltzMacaroonPath;
        this.previousSelNode = JSON.parse(JSON.stringify(this.selNode));
        this.logger.info(selNode);
      });
  }

  onEnableServiceChanged(event) {
    this.enableBoltz = event.checked;
    if (!this.enableBoltz) {
      this.macaroonPath = '';
      this.serverUrl = '';
    }
  }

  onUpdateService(): boolean | void {
    if (this.serverUrl && this.serverUrl.trim() !== '' && !this.form.controls.srvrUrl.value.includes('https://')) {
      this.form.controls.srvrUrl.setErrors({ invalid: true });
    }
    if (this.enableBoltz &&
      (!this.serverUrl ||
        this.serverUrl.trim() === '' ||
        !this.serverUrl.includes('https://') ||
        !this.macaroonPath ||
        this.macaroonPath.trim() === '')
    ) {
      return true;
    }
    this.logger.info(this.selNode);
    if (!this.enableBoltz) {
      delete this.selNode.settings.boltzServerUrl;
      delete this.selNode.authentication.boltzMacaroonPath;
    } else {
      this.selNode.settings.boltzServerUrl = this.serverUrl;
      this.selNode.authentication.boltzMacaroonPath = this.macaroonPath;
    }
    this.store.dispatch(updateNodeSettings({ payload: this.selNode }));
  }

  onReset() {
    this.selNode = JSON.parse(JSON.stringify(this.previousSelNode));
    this.serverUrl = this.selNode.settings.boltzServerUrl || '';
    this.macaroonPath = this.selNode.authentication.boltzMacaroonPath;
    this.enableBoltz = !!(this.serverUrl && this.serverUrl.trim() !== '');
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
