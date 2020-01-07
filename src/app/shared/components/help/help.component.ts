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
    this.helpTopics.push(new HelpTopic('Getting started', 'Funding your node is the first step to get started.\n' +
    'On the *On-chain* menu:\n' +
    '1. Generate a new address on the *Recieve* tab.\n'+
    '2. Send funds to the address.\n' +
    '3. Wait for the balance to be confirmed on-chain before proceeding further.\n' +
    '<a href="http://localhost:3000/rtl/lnd/onchain">On-Chain</a>.'));
    this.helpTopics.push(new HelpTopic('Connect with peers', 'Connecting with network peers is the next step.\n' +
    'Go the *Peer/Channels* page under the *Lightning* menu :\n' +
    '1. Get the peer pubkey and host address in the pubkey@ip:port format.\n' +
    '2. On the *Peers" enter the peer address and connect.\n' +
    '3. Once the peer is connected, you can open channel with the peer.\n'+
    '<a href="http://localhost:3000/rtl/lnd/peerschannels">Peers/Channels</a>.'));
    this.helpTopics.push(new HelpTopic('Opening Channels', 'Opening channel with the peer is the next step.\n' +
    'Go the *Peer/Channels* page under the *Lightning* menu:\n' +
    '1. On the *Channels* section, select the Alias of the connected peer from the drop-down\n' +
    '2. Specify the amount to commit to the channel.\n' +
    '3. There are a variety of options available while opening a channel. \n' +
    '   a. Private Channel - When this option is selected, the channel is opened privately and not broadcast. \n' +
    '   b. Priority (advanced option) - Specify either Target confirmation Block or Fee in Sat/Byte. \n' +
    '   c. Spend Unconfirmd Output (advanced option) - Allow channels to be opened with unconfirmed UTXOs.\n' + 
    '<a href="http://localhost:3000/rtl/lnd/peerschannels">Peers/Channels</a>.'));
  }

}
