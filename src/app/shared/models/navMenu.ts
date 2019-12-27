import { faTachometerAlt, faLink, faBolt, faExchangeAlt, faUsers, faMapSigns, faQuestion, faSearch, faTools, faProjectDiagram, faDownload, faServer } from '@fortawesome/free-solid-svg-icons';
import { UserPersonaEnum } from '../services/consts-enums-functions';

export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/lnd/home', userPersona: UserPersonaEnum.ALL},
    {id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link:  '/lnd/onchain', userPersona: UserPersonaEnum.ALL},
    {id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/lnd/peerschannels', userPersona: UserPersonaEnum.ALL, children: [
      {id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/lnd/peerschannels', userPersona: UserPersonaEnum.ALL},
      {id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/lnd/transactions', userPersona: UserPersonaEnum.ALL},
      {id: 33, parentId: 3, name: 'Backup', iconType: 'FA', icon: faDownload, link: '/lnd/backup', userPersona: UserPersonaEnum.ALL},
      {id: 34, parentId: 3, name: 'Routing', iconType: 'FA', icon: faMapSigns, link: '/lnd/routing', userPersona: UserPersonaEnum.ALL},
      {id: 35, parentId: 3, name: 'Graph Lookup', iconType: 'FA', icon: faSearch, link: '/lnd/lookups', userPersona: UserPersonaEnum.ALL}
    ]},
    {id: 5, parentId: 0, name: 'Network', iconType: 'FA', icon: faProjectDiagram, link: '/lnd/network', userPersona: UserPersonaEnum.OPERATOR},
    {id: 6, parentId: 0, name: 'Node/Network', iconType: 'FA', icon: faServer, link: '/lnd/network', userPersona: UserPersonaEnum.MERCHANT},
    {id: 7, parentId: 0, name: 'Settings', iconType: 'FA', icon: faTools, link: '/settings', userPersona: UserPersonaEnum.ALL},
    {id: 8, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help', userPersona: UserPersonaEnum.ALL}    
  ],
  CLChildren: [
    {id: 1, parentId: 0, name: 'Home', icon: 'home', link: '/cl/home', userPersona: UserPersonaEnum.ALL},
    {id: 2, parentId: 0, name: 'On Chain', icon: 'account_balance_wallet', link:  '/cl/onchain', userPersona: UserPersonaEnum.ALL},
    {id: 3, parentId: 0, name: 'Peers', icon: 'group', link: '/cl/peers', userPersona: UserPersonaEnum.ALL},
    {id: 4, parentId: 0, name: 'Channels', icon: 'settings_ethernet', link: '/cl/chnlmanage', userPersona: UserPersonaEnum.ALL},
    {id: 5, parentId: 0, name: 'Payments', icon: 'payment', link: '/cl/paymentsend', userPersona: UserPersonaEnum.ALL, children: [
      {id: 51, parentId: 5, name: 'Send', icon: 'send', link: '/cl/paymentsend', userPersona: UserPersonaEnum.ALL},
      {id: 52, parentId: 5, name: 'Query Routes', icon: 'explore', link: '/cl/queryroutes', userPersona: UserPersonaEnum.ALL}
    ]},
    {id: 6, parentId: 0, name: 'Invoices', icon: 'receipt', link: '/cl/invoices', userPersona: UserPersonaEnum.ALL},
    {id: 7, parentId: 0, name: 'Forwarding History', icon: 'timeline', link: '/cl/forwardinghistory', userPersona: UserPersonaEnum.ALL},
    {id: 9, parentId: 0, name: 'Lookups', icon: 'search', link: '/cl/lookups', userPersona: UserPersonaEnum.ALL},    
    {id: 10, parentId: 0, name: 'Node Config', icon: 'perm_data_setting', link: '/advanced', userPersona: UserPersonaEnum.ALL},
    {id: 11, parentId: 0, name: 'Settings', icon: 'settings', link: '/settings', userPersona: UserPersonaEnum.ALL},
    {id: 12, parentId: 0, name: 'Help', icon: 'help', link: '/help', userPersona: UserPersonaEnum.ALL}
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
  userPersona?: string;
  children?: MenuChildNode[];
}
