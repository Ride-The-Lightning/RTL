import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

import { HelpTopic, ConfigSettingsNode } from '../../models/RTLconfig';
import { SessionService } from '../../services/session.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit, OnDestroy {
  public helpTopics: Array<HelpTopic> = [];
  public faQuestion = faQuestion;
  public selNode: ConfigSettingsNode;
  public LNPLink = '/lnd/';
  public flgLoggedIn = false;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private sessionService: SessionService) {
    this.helpTopics.push(new HelpTopic({
      question: 'Getting started',
      answer: 'Funding your node is the first step to get started.\n' +
        'Go to the "On-chain" page of the app:\n' +
        '1. Generate a new address on the "Recieve" tab.\n'+
        '2. Send funds to the address.\n' +
        '3. Wait for the balance to be confirmed on-chain before proceeding further.\n' +
        '3. Connecting with network peers and opening channels is next.\n',
      link: 'onchain',
      linkCaption: 'On-Chain page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Connect with peers',
      answer: 'Connect with network peers to open channels with them.\n' +
        'Go to "Peer/Channels" page under the "Lightning" menu :\n' +
        '1. Get the peer pubkey and host address in the pubkey@ip:port format.\n' +
        '2. On the "Peers" enter the peer address and connect.\n' +
        '3. Once the peer is connected, you can open channel with the peer.\n'+
        '4. A variety of actions can be performed on the connected peers page for each peer:\n'+
        '   a. View Info - View the peer details.\n' +
        '   b. Open Channel - Open channel with the peer.\n' +
        '   c. Disconnect - Disconnect from the peer.\n',
      link: 'peerschannels',
      linkCaption: 'Peers/Channels page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Opening Channels',
      answer: 'Open channels with a connected network peer.\n' +
        'Go to "Peer/Channels" page under the "Lightning" menu:\n' +
        '1. On the "Channels" section, select the alias of the connected peer from the drop-down\n' +
        '2. Specify the amount to commit to the channel and click on "Open Channel".\n' +
        '3. There are a variety of options available while opening a channel. \n' +
        '   a. Private Channel - When this option is selected, a private channel is opened with the peer. \n' +
        '   b. Priority (advanced option) - Specify either Target confirmation Block or Fee in Sat/Byte. \n' +
        '   c. Spend Unconfirmd Output (advanced option) - Allow channels to be opened with unconfirmed UTXOs.\n' +
        '4. Track the pending open channels under the "Pending" tab . \n' +
        '5. Wait for the channel to be confirmed. Only a confimed channel can be used for payments or routing. \n',
      link: 'peerschannels',
      linkCaption: 'Peers/Channels page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Channel Management', 
      answer: 'Channel maintenance and balance score.\n' +
        'Go to "Peer/Channels" page under the "Lightning" menu:\n' +
        '1. A variety of actions can be perfomed on the open channels under the "Open" tab, with the "Actions" button:\n' +
        '   a. View Info - View the channel details.\n' +
        '   b. View Remote Fee - View the fee policy on the channel of the remote peer.\n' +
        '   c. Update Fee Policy - Modify the fee policy on the channel.\n' +
        '   d. Close Channel - Close the channel.\n' +
        '2. Balance Score is a "balancedness" metric score for the channel. \n' +
        '   a. It helps measure how balanced the remote and local balances are, on a channel.\n' +
        '   b. A perfectly balanced channel has a score of one, where as a completely lopsided one has a score of zero.\n' +
        '   c. The formula for calculating the score is "1 - abs((local bal - remote bal)/total bal)".\n',
      link: 'peerschannels',
      linkCaption: 'Peers/Channels page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Lightning Transactions - Payments',
      answer: 'Sending Payments from your node.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Payments tab is for making payments via your node\n' +
        '   1. Input a non-expired lightning invoice (Bolt11 format) in the "Payment request" field and click on "Send Payment" to send.\n' +
        '   2. Advanced option # 1 (LND only) - Specify a limit on the routing fee which you are willing to pay, for the payment.\n' +
        '   3. Advanced option # 2 (LND only) - Specify the outgoing channel which you want the payment to go through.\n', 
      link: 'transactions',
      linkCaption: 'Transactions page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Lightning Transactions - Invoices',
      answer: 'Receiving Payments on your node.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Invoices tab is for receiving payments on your node.\n' +
        '   1. Memo - Description you want to provide on the invoice.\n' +
        '   2. Expiry - The time period, after which the invoice will be invalid.\n' +
        '   3. Private Routing Hints - Generate an invoice with routing hints for private channels.\n', 
      link: 'transactions',
      linkCaption: 'Transactions page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Lightning Transactions - Query Route', 
      answer: 'Querying Payment Routes.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Query Routes tab is for querying a potential path to a node and a routing fee estimate for a payment amount.\n'+
        '   1. Destination Pubkey - Pubkey of the node, you want to send the payment to.\n' +
        '   2. Amount - Amount in Sats, which you want to send to the node.\n',
      link: 'transactions',
      linkCaption: 'Transactions page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Channel Backups',
      answer: 'Channel Backups are important to ensure that you have means to recover funds in case of node failures.\n' +
        'Backup folder location can be customized in the RTL config file with the channelBackupPath field.\n' +
        'RTL automatically creates all channel backup on server startup, as well as everytime a channel is opened or closed\n'+
        'You can verify the all channel backup file by clicking on "Verify All" Button on the backup page.\n'+
        'You can also backup each channel individually and verify them.\n'+
        '** Keep taking backups of your channels regularly and store them in redundant locations **.\n',
      link: 'backup',
      linkCaption: 'Channel Backups',
      lnImplementation: 'LND'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Channel Restore',
      answer: 'Channel Restore is used to recover funds from the channel backup files in case of node failures.\n' +
        'Follow the below steps to perform fund restoration.\n\n' +
        'Prerequisite:\n'+
        '1. The node has been restored with the LND recovery seed.\n'+
        '2. RTL generated channel backup file/s is available (all channel backup file is channel-all.bak).\n\n'+
        'Recovery:\n'+
        '1. Create a restore folder in your folder backup location, as specified in the RTL config file.\n'+
        '2. Place the channel backup file in the restore folder.\n'+
        '3. Go to the "Restore" tab under the "Backup" page of RTL.\n'+
        '4. RTL will list the options to restore funds from the all channel file or individual channel backup file.\n'+
        '5. Click on the Restore icon on the grid to restore the funds.\n'+
        '6. Once the restore function is executed successfully, RTL will rename the backup file and it will not be accessible from the UI.\n'+
        '7. Restore function will force close the channels and recover the funds from them.\n'+
        '8. The pending close channels can be viewed under the "Pending" tab on the "Peer/Channels" page.\n'+
        '9. Once the channel is closed, the corresponding pending on-chain transactions can be viewed on the "On-Chain" page.\n'+
        '10. Once the transactions are confirmed, the channels funds will be restored to your LND Wallet.\n',
      link: 'backup',
      linkCaption: 'Channel Backups',
      lnImplementation: 'LND'      
    }));
      this.helpTopics.push(new HelpTopic({
        question: 'Forwarding History', 
        answer: 'Transactions routed by the node.\n' +
          'Go to "Routing" page under the "Lightning" menu :\n' +
          'Transactions routed by the node are listed on this page along with channels and the fee earned by transaction.\n',
        link: 'routing',
        linkCaption: 'Forwarding History',
        lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Graph Lookup', 
      answer: 'Querying your node graph for network node and channel information.\n' +
        'Go to "Graph Lookup" page under the "Lightning" menu :\n' +
        'Each node maintains a network graph for the information on all the nodes and channels on the network.\n'+
        'You can lookup information on nodes and channels from your graph:\n'+
        '   1. Node Lookup - Enter the pubkey to perform the lookup.\n' +
        '   2. Channel Lookup - Enter the short channel ID to perform the lookup.\n',
      link: 'lookups',
      linkCaption: 'Graph Lookup page',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Settings', 
      answer: 'RTL Offers certain customizations on the UI to personalize your experience on the app\n' +
        'Go to "Settings" page to access the customization options.\n' +
        'Node Layout Options\n'+
        '   1. User Persona - Two options are available to change the dashboard based on the persona.\n' +
        '   2. Currency Unit - You can choose your preferred fiat currency, to view the onchain and channel balances in the choosen fiat currency.\n'+
        '   3. Default Node - If you are managing multiple nodes via RTL UI, you can select the default node to load upon login.\n'+
        'Other Customizations include day and night mode and a choice of color themes to select from.\n',
      lnImplementation: 'ALL'
    }));
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(rtlStore => {
      this.selNode = rtlStore.selNode;
      switch (this.selNode.lnImplementation.toUpperCase()) {
        case 'CLT':
          this.LNPLink = '/cl/';  
          break;
      
        case 'ECL':
          this.LNPLink = '/ecl/';  
          break;

        default:
          this.LNPLink = '/lnd/';
          break;
      }
    });
    this.sessionService.watchSession()
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(session => {
      this.flgLoggedIn = (session.token) ? true : false;
    });    
    if (this.sessionService.getItem('token')) { this.flgLoggedIn = true; }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }  

}
