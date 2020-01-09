import { Component, OnInit } from '@angular/core';
import { faWallet } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'rtl-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  public faWallet = faWallet;

  constructor() {}

  ngOnInit() {}

}
