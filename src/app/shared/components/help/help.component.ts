import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

import { HelpTopic, ConfigSettingsNode } from '../../models/RTLconfig';
import { SessionService } from '../../services/session.service';

import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit, OnDestroy {

  public helpTopics: Array<HelpTopic> = [];
  public faQuestion = faQuestion;
  public selNode: ConfigSettingsNode | any;
  public LNPLink = '/lnd/';
  public flgLoggedIn = false;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private sessionService: SessionService) {}

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.selNode = selNode;
      if (this.selNode.lnImplementation && this.selNode.lnImplementation.trim() !== '') {
        this.LNPLink = '/' + this.selNode.lnImplementation.toLowerCase() + '/';
        this.addHelpTopics();
      }
    });
    this.sessionService.watchSession().
      pipe(takeUntil(this.unSubs[1])).
      subscribe((session) => {
        this.flgLoggedIn = !!session.token;
      });
    if (this.sessionService.getItem('token')) {
      this.flgLoggedIn = true;
    }
  }

  addHelpTopics() {
    this.helpTopics = [];
    this.helpTopics.push(new HelpTopic({
      question: 'Getting started',
      answer: 'Funding your node is the first step to get started.\n' +
        'Go to the "On-chain" page of the app:\n' +
        '1. Generate a new address on the "Recieve" tab.\n' +
        '2. Send funds to the address.\n' +
        '3. Wait for the balance to be confirmed on-chain before proceeding further.\n' +
        '3. Connecting with network peers and opening channels is next.\n',
      link: this.LNPLink + 'onchain/receive/utxos',
      linkCaption: 'On-Chain',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Connect with peers',
      answer: 'Connect with network peers to open channels with them.\n' +
        'Go to "Peer/Channels" page under the "Lightning" menu :\n' +
        '1. Get the peer pubkey and host address in the pubkey@ip:port format.\n' +
        '2. On the "Peers" enter the peer address and connect.\n' +
        '3. Once the peer is connected, you can open channel with the peer.\n' +
        '4. A variety of actions can be performed on the connected peers page for each peer:\n' +
        '   a. View Info - View the peer details.\n' +
        '   b. Open Channel - Open channel with the peer.\n' +
        '   c. Disconnect - Disconnect from the peer.\n',
      link: this.LNPLink + 'connections/peers',
      linkCaption: 'Peers',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Opening Channels',
      answer: 'Open channels with a connected peer.\n' +
        'Go to "Peer/Channels" page under the "Lightning" menu:\n' +
        '1. On the "Channels" section, click on "Open Channel"\n' +
        '2. On the "Open Channel" modal, select the alias of the connected peer from the drop-down\n' +
        '2. Specify the amount to commit to the channel and click on "Open Channel".\n' +
        '3. There are a variety of options available while opening a channel. \n' +
        '   a. Private Channel - When this option is selected, a private channel is opened with the peer. \n' +
        '   b. Priority (advanced option) - Specify either Target confirmation Block or Fee in Sat/vByte. \n' +
        '   c. Spend Unconfirmd Output (advanced option) - Allow channels to be opened with unconfirmed UTXOs.\n' +
        '4. Track the pending open channels under the "Pending" tab. \n' +
        '5. Wait for the channel to be confirmed. Only a confimed channel can be used for payments or routing. \n',
      link: this.LNPLink + 'connections/channels/open',
      linkCaption: 'Channels',
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
        '   d. Circular Rebalance - Off-chain rebalance channels by making a payment to yourself across a circular path of chained payment channels.\n' +
        '   e. Close Channel - Close the channel.\n' +
        '2. Balance Score is a "balancedness" metric score for the channel. \n' +
        '   a. It helps measure how balanced the remote and local balances are, on a channel.\n' +
        '   b. A perfectly balanced channel has a score of one, where as a completely lopsided one has a score of zero.\n' +
        '   c. The formula for calculating the score is "1 - abs((local bal - remote bal)/total bal)".\n',
      link: this.LNPLink + 'connections/channels/open',
      linkCaption: 'Channels',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Buying Liquidity',
      answer: 'Buying liquidity for your node.\n' +
        'Go to "Liquidity Ads" page under the "Lightning" menu:\n' +
        '   1. Filter ads by liquidity amount and channel opening fee rate.\n' +
        '   2. Research additionally on liquidity provider nodes before selecting.\n' +
        '   3. Select the best liquidity node peer for your need and click on "Open Channel" from "Actions" drop-down.\n' +
        '   4. Confirm amount, rates and total cost on the modal and click on "Execute" to buy liquidity.\n',
      link: this.LNPLink + 'liquidityads',
      linkCaption: 'Liquidity Ads',
      lnImplementation: 'CLN'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Payments',
      answer: 'Sending Payments from your node.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Payments tab is for making payments via your node\n' +
        '   1. Input a non-expired lightning invoice (Bolt11 format) in the "Payment Request" field and click on "Send Payment" to send.\n' +
        '   2. Advanced option # 1 (LND only) - Specify a limit on the routing fee which you are willing to pay, for the payment.\n' +
        '   3. Advanced option # 2 (LND only) - Specify the outgoing channel which you want the payment to go through.\n',
      link: this.LNPLink + 'transactions/payments',
      linkCaption: 'Payments',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Invoices',
      answer: 'Receiving Payments on your node.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Invoices tab is for receiving payments on your node.\n' +
        '   1. Memo - Description you want to provide on the invoice.\n' +
        '   2. Expiry - The time period, after which the invoice will be invalid.\n' +
        '   3. Private Routing Hints - Generate an invoice with routing hints for private channels.\n',
      link: this.LNPLink + 'transactions/invoices',
      linkCaption: 'Invoices',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Offers',
      answer: 'Send offer payments, create offer invoices and bookmark paid offers on your node.\n' +
        'Go to the "Transactions" page under the "Lightning" menu :\n' +
        'Payment for bolt12 offer invoice can be done on "Payments" tab:\n' +
        '   1. Click on "Send Payment" button.\n' +
        '   2. Select "Offer" option on the modal.\n' +
        '   2. Offer Request - Input offer request (Bolt12 format) in the input box.\n' +
        '   3. Bookmark - Select the checkbox to bookmark this offer for future use.\n' +
        'Offers tab is for creating bolt12 offer invoice on your node:\n' +
        '   1. Click on "Create Offer" button.\n' +
        '   2. Description - Description you want to provide on the offer invoice.\n' +
        '   3. Amount - Amount for the offer invoice.\n' +
        '   4. Vendor - Vendor of the offer.\n' +
        'Paid offer bookmarks shows the list of paid offers saved for future payments.\n',
      link: this.LNPLink + 'transactions/offers',
      linkCaption: 'Offers',
      lnImplementation: 'CLN'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Channel Backups',
      answer: 'Channel Backups are important to ensure that you have means to recover funds in case of node failures.\n' +
        'Backup folder location can be customized in the RTL config file with the channelBackupPath field.\n' +
        'RTL automatically creates all channel backup on server startup, as well as everytime a channel is opened or closed\n' +
        'You can verify the all channel backup file by clicking on "Verify All" Button on the backup page.\n' +
        'You can also backup each channel individually and verify them.\n' +
        '** Keep taking backups of your channels regularly and store them in redundant locations **.\n',
      link: this.LNPLink + 'channelbackup/bckup',
      linkCaption: 'Channel Backups',
      lnImplementation: 'LND'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Channel Restore',
      answer: 'Channel Restore is used to recover funds from the channel backup files in case of node failures.\n' +
        'Follow the below steps to perform fund restoration.\n\n' +
        'Prerequisite:\n' +
        '1. The node has been restored with the LND recovery seed.\n' +
        '2. RTL generated channel backup file/s is available (all channel backup file is channel-all.bak).\n\n' +
        'Recovery:\n' +
        '1. Create a restore folder in your folder backup location, as specified in the RTL config file.\n' +
        '2. Place the channel backup file in the restore folder.\n' +
        '3. Go to the "Restore" tab under the "Backup" page of RTL.\n' +
        '4. RTL will list the options to restore funds from the all channel file or individual channel backup file.\n' +
        '5. Click on the Restore icon on the grid to restore the funds.\n' +
        '6. Once the restore function is executed successfully, RTL will rename the backup file and it will not be accessible from the UI.\n' +
        '7. Restore function will force close the channels and recover the funds from them.\n' +
        '8. The pending close channels can be viewed under the "Pending" tab on the "Peer/Channels" page.\n' +
        '9. Once the channel is closed, the corresponding pending on-chain transactions can be viewed on the "On-Chain" page.\n' +
        '10. Once the transactions are confirmed, the channels funds will be restored to your LND Wallet.\n',
      link: this.LNPLink + 'channelbackup/restore',
      linkCaption: 'Channel Restore',
      lnImplementation: 'LND'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Forwarding History',
      answer: 'Transactions routed by the node.\n' +
        'Go to "Routing" page under the "Lightning" menu :\n' +
        'Transactions routed by the node are listed on this page along with channels and the fee earned by transaction.\n',
      link: this.LNPLink + 'routing/forwardinghistory',
      linkCaption: 'Forwarding History',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Lightning Reports',
      answer: 'Routing and transactions data reports.\n' +
        'Go to "Reports" page under the "Lightning" menu :\n' +
        'Report can be generated on monthly/yearly basis by selecting the reporting period, month, and year.\n',
      link: this.LNPLink + 'reports/routingreport',
      linkCaption: 'Reports',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Graph Lookup',
      answer: 'Querying your node graph for network node and channel information.\n' +
        'Go to "Graph Lookup" page under the "Lightning" menu :\n' +
        'Each node maintains a network graph for the information on all the nodes and channels on the network.\n' +
        'You can lookup information on nodes and channels from your graph:\n' +
        '   1. Node Lookup - Enter the pubkey to perform the lookup.\n' +
        '   2. Channel Lookup - Enter the short channel ID to perform the lookup.\n',
      link: this.LNPLink + 'graph/lookups',
      linkCaption: 'Graph Lookup',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Query Route',
      answer: 'Querying Payment Routes.\n' +
        'Go to the "Graph Lookup" page under the "Lightning" menu :\n' +
        'Query Routes tab is for querying a potential path to a node and a routing fee estimate for a payment amount.\n' +
        '   1. Destination Pubkey - Pubkey of the node, you want to send the payment to.\n' +
        '   2. Amount - Amount in Sats, which you want to send to the node.\n',
      link: this.LNPLink + 'graph/queryroutes',
      linkCaption: 'Query Routes',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Sign & Verify Messages',
      answer: 'Messages signing and verification.\n' +
        'Go to the "Sign/Verify" page under the "Lightning" menu :\n' +
        '   1. Sign your message on "Sign" tab.\n' +
        '   2. Go to "Verify" tab to verify a message.\n',
      link: this.LNPLink + 'messages/sign',
      linkCaption: 'Messages',
      lnImplementation: 'LND'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Sign & Verify Messages',
      answer: 'Messages signing and verification.\n' +
        'Go to the "Sign/Verify" page under the "Lightning" menu :\n' +
        '   1. Sign your message on "Sign" tab.\n' +
        '   2. Go to "Verify" tab to verify a message.\n',
      link: this.LNPLink + 'messages/sign',
      linkCaption: 'Messages',
      lnImplementation: 'CLN'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Node Settings',
      answer: 'RTL offers certain customizations on the UI to personalize your experience on the app\n' +
        'Go to "Node Config" page to access the customization options.\n' +
        'Node Layout Options\n' +
        '   1. User Persona - Two options are available to change the dashboard based on the persona.\n' +
        '   2. Currency Unit - You can choose your preferred fiat currency, to view the onchain and channel balances in the choosen fiat currency.\n' +
        '   3. Other customizations include day and night mode and a choice of color themes to select from.\n' +
        'Services Options\n' +
        '   Loop (LND only), Boltz (LND only) & Peerswap (CLN only) services can be configured.\n' +
        'Experimental Options (CLN only)\n' +
        '   Offers and Liquidity Ads can be enabled/disabled.\n' +
        'Show LN Config (if configured)\n' +
        '   Shows lightning config file.\n',
      link: '../config/layout',
      linkCaption: 'Node Settings',
      lnImplementation: 'ALL'
    }));
    this.helpTopics.push(new HelpTopic({
      question: 'Application Settings',
      answer: 'RTL also offers certain customizations on the application level\n' +
        'Go to top right menu "Settings" page to access these options.\n' +
        'Default Node Option\n' +
        'If you are managing multiple nodes via RTL UI, you can select the default node to load upon login.\n' +
        'Authentication Option\n' +
        'Password and 2FA update options are available here.\n' +
        'Show Bitcoin Config (if configured)\n' +
        '   Shows bitcoin config file.\n',
      link: '../settings/app',
      linkCaption: 'Application Settings',
      lnImplementation: 'ALL'
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
