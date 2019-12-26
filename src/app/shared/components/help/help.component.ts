import { Component, OnInit } from '@angular/core';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

export class HelpTopic {
  question: string;
  answer: string;

  constructor(ques: string, ans: string) {
    this.question = ques;
    this.answer = ans;
  }
}

@Component({
  selector: 'rtl-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  public helpTopics: Array<HelpTopic> = [];
  public faQuestion = faQuestion;

  constructor() {}

  ngOnInit() {
    this.helpTopics.push(new HelpTopic('Getting started', 'Funding you node is the first step to start ' +
    'operating on Lightning Network. To fund your node go to the *On-chain* menu of the application.' +
    ' Click on the *Receive* section of *On-Chain Transactions*, generate a new address' +
     ' and send funds on that address. Once the node is funded, next step is to connect with network peers ' +
      'and open channels with them.'));
    this.helpTopics.push(new HelpTopic('Connect with peers', 'To connect with peers go the *Peer/Channels* ' +
    'menu under the *Lightning* menu. To connect with a peer you need a pubkey and host information in the ' +
    'pubkey@ip:port format. You can connect with a peer on the  *Peers* section or choose the *ADD PEER* ' +
    'option from the Alias drop-down on *Channels* section. Once the peer is connected, you can open ' +
    'channels with them'));
    this.helpTopics.push(new HelpTopic('Opening Channels', 'To open channel with a peers go the *Peer/Channels* ' +
    'menu under the *Lightning* menu. On the *Channels* section, select the Alias of the connected peer from ' +
    'the drop-down, specify the amount to commit to the channel. There are a variety of options which can be ' +
    'specified while opening a channel. \n' +
    '1. Private Channel - When this option is selected, the channel is opened privately and not broadcast. \n' +
    '2. Priority (advanced option) - Specify either Target confirmation Block or Fee in Sat/Byte. \n' +
    '3. Spend Unconfirmd Output (advanced option) - Allow channels to be opened with unconfirmed UTXOs.'));
  }

}
