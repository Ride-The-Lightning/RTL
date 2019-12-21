import { Component } from '@angular/core';
import { faArchive } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent {
  public faArchive = faArchive;

  constructor() {}

}
