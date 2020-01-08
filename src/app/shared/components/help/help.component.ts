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
    'Go to the "On-chain" page of the app:\n' +
    '1. Generate a new address on the "Recieve" tab.\n'+
    '2. Send funds to the address.\n' +
    '3. Wait for the balance to be confirmed on-chain before proceeding further.\n' +
    '3. Connecting with network peers and opening channels is next.\n' +
    '<a href="http://localhost:3000/rtl/lnd/onchain">On-Chain page</a>'));
    this.helpTopics.push(new HelpTopic('Connect with peers', 'Connect with network peers to open channels with them.\n' +
    'Go to "Peer/Channels" page under the "Lightning" menu :\n' +
    '1. Get the peer pubkey and host address in the pubkey@ip:port format.\n' +
    '2. On the "Peers" enter the peer address and connect.\n' +
    '3. Once the peer is connected, you can open channel with the peer.\n'+
    '4. A variety of actions can be performed on the connected peers page for each peer:\n'+
    '   a. View Info - View the peer details.\n' +
    '   b. Open Channel - Open channel with the peer.\n' +
    '   c. Disconnect - Disconnect from the peer.\n' +
    '<a href="http://localhost:3000/rtl/lnd/peerschannels">Peers/Channels page</a>'));
    this.helpTopics.push(new HelpTopic('Opening Channels', 'Open channels with a connected network peer.\n' +
    'Go to "Peer/Channels" page under the "Lightning" menu:\n' +
    '1. On the "Channels" section, select the alias of the connected peer from the drop-down\n' +
    '2. Specify the amount to commit to the channel and click on "Open Channel".\n' +
    '3. There are a variety of options available while opening a channel. \n' +
    '   a. Private Channel - When this option is selected, a private channel is opened with the peer. \n' +
    '   b. Priority (advanced option) - Specify either Target confirmation Block or Fee in Sat/Byte. \n' +
    '   c. Spend Unconfirmd Output (advanced option) - Allow channels to be opened with unconfirmed UTXOs.\n' +
    '4. Track the pending open channels under the "Pending" tab . \n' +
    '5. Wait for the channel to be confirmed. Only a confimed channel can be used for payments or routing. \n' +
    '<a href="http://localhost:3000/rtl/lnd/peerschannels">Peers/Channels page</a>'));
    this.helpTopics.push(new HelpTopic('Channel Management', 'Channel maintenance and balance score.\n' +
    'Go to "Peer/Channels" page under the "Lightning" menu:\n' +
    '1. A variety of actions can be perfomed on the open channels under the "Open" tab, with the "Actions" button:\n' +
    '   a. View Info - View the channel details.\n' +
    '   b. View Remote Fee - View the fee policy on the channel of the remote peer.\n' +
    '   c. Update Fee Policy - Modify the fee policy on the channel.\n' +
    '   d. Close Channel - Close the channel.\n' +
    '2. Balance Score is balancedness metric score for the channel:\n' +
    '   a. It helps measure how balanced the remote and local balance on a channel is.\n' +
    '   b. A perfectly balanced channel has a score of one, where a completely lopsided one has a score of zero.\n' +
    '   c. The formular for calculating the score is "1 - abs((local bal - remote bal)/total bal)".\n' +
    '<a href="http://localhost:3000/rtl/lnd/peerschannels">Peers/Channels page</a>'));
    this.helpTopics.push(new HelpTopic('Lightning Transactions - Payments', 'Sending Payments from your node.\n' +
    'Go to "Transactions" page under the "Lightning" menu :\n' +
    'Payments - Payments tab is for making payments via your node\n' +
    '   1. Input a non-expired lightning invoice (Bolt11 format) in the "Payment request" field and click on "Send Payment" to send.\n' +
    '   2. Advanced option # 1 - Specify a limit on the routing fee you are willing to pay for the payment.\n' +
    '   3. Advanced option # 2 - Specify the outgoing channel through which you want the payment to go out.\n' +
    '<a href="http://localhost:3000/rtl/lnd/transactions">Transactions page</a>'));
    this.helpTopics.push(new HelpTopic('Lightning Transactions - Invoices', 'Receiving Payments on your node.\n' +
    'Go to "Transactions" page under the "Lightning" menu :\n' +
    'Invoices - Invoices tab is for receiving payments on your node.\n' +
    '   1. Memo - Description you want to provide on the invoice.\n' +
    '   2. Expiry - The time period, after which the invoice will be invalid.\n' +
    '   3. Private Routing Hints - Generate an invoice with routing hints for private channels.\n' +
    '<a href="http://localhost:3000/rtl/lnd/transactions">Transactions page</a>'));
    this.helpTopics.push(new HelpTopic('Lightning Transactions - Query Route', 'Querying Payment Routes.\n' +
    'Go to "Transactions" page under the "Lightning" menu :\n' +
    'Query Routes - Query Routes tab is for querying a potential path to a node and a routing fee estimate for a payment amount.\n'+
    '   1. Destination Pubkey - Pubkey of the node, you want to send the payment to.\n' +
    '   2. Amount - Amount in Sats, which you want to send to the node.\n' +
    '<a href="http://localhost:3000/rtl/lnd/transactions">Transactions page</a>'));
  }

}
