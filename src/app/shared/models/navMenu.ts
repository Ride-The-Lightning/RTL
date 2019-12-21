import { faTachometerAlt, faLink, faBolt, faExchangeAlt, faUsers, faArchive, faProjectDiagram, faNetworkWired, faCog, faQuestion, faSearch, faTools } from '@fortawesome/free-solid-svg-icons';

export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/lnd/home'},
    {id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link:  '/lnd/onchain'},
    {id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/lnd/peerschannels', children: [
      {id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/lnd/peerschannels'},
      {id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/lnd/transactions'},
      {id: 33, parentId: 3, name: 'Backup', iconType: 'FA', icon: faArchive, link: '/lnd/backup'},
      {id: 34, parentId: 3, name: 'Routing', iconType: 'FA', icon: faProjectDiagram, link: '/lnd/routing'},
      {id: 35, parentId: 3, name: 'Graph Lookup', iconType: 'FA', icon: faSearch, link: '/lnd/lookups'},
      {id: 36, parentId: 3, name: 'Network', iconType: 'FA', icon: faNetworkWired, link: '/lnd/network'}
    ]},
    {id: 4, parentId: 0, name: 'Advanced', iconType: 'FA', icon: faCog, link: '/advanced'},
    {id: 5, parentId: 0, name: 'Settings', iconType: 'FA', icon: faTools, link: '/settings'},
    {id: 6, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help'}    
  ],
  CLChildren: [
    {id: 1, parentId: 0, name: 'Home', icon: 'home', link: '/cl/home'},
    {id: 2, parentId: 0, name: 'On Chain', icon: 'account_balance_wallet', link:  '/cl/onchain'},
    {id: 3, parentId: 0, name: 'Peers', icon: 'group', link: '/cl/peers'},
    {id: 4, parentId: 0, name: 'Channels', icon: 'settings_ethernet', link: '/cl/chnlmanage'},
    {id: 5, parentId: 0, name: 'Payments', icon: 'payment', link: '/cl/paymentsend', children: [
      {id: 51, parentId: 5, name: 'Send', icon: 'send', link: '/cl/paymentsend'},
      {id: 52, parentId: 5, name: 'Query Routes', icon: 'explore', link: '/cl/queryroutes'}
    ]},
    {id: 6, parentId: 0, name: 'Invoices', icon: 'receipt', link: '/cl/invoices'},
    {id: 7, parentId: 0, name: 'Forwarding History', icon: 'timeline', link: '/cl/forwardinghistory'},
    {id: 9, parentId: 0, name: 'Lookups', icon: 'search', link: '/cl/lookups'},    
    {id: 10, parentId: 0, name: 'Node Config', icon: 'perm_data_setting', link: '/advanced'},
    {id: 11, parentId: 0, name: 'Settings', icon: 'settings', link: '/settings'},
    {id: 12, parentId: 0, name: 'Help', icon: 'help', link: '/help'}
  ]
};

export class MenuRootNode {
  LNDChildren?: MenuChildNode[];
  CLChildren?: MenuChildNode[];
}

export class MenuChildNode {
  id: number;
  parentId: number;
  name?: string;
  iconType?: string;
  icon?: any | string;
  link?: any;
  children?: MenuChildNode[];
}
