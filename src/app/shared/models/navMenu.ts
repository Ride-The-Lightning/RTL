import { faTachometerAlt, faLink, faBolt, faExchangeAlt, faUsers, faProjectDiagram, faCog, faLifeRing, faSearch, faTools } from '@fortawesome/free-solid-svg-icons';

export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType:'SVG', icon: 'dashboard', link: '/lnd/home'},
    {id: 2, parentId: 0, name: 'On-chain', iconType:'SVG', icon: 'on-chain', link:  '/lnd/transsendreceive'},
    {id: 3, parentId: 0, name: 'Lightning', iconType:'SVG', icon: 'lightning', link: '/lnd/chnlmanage', children: [
      {id: 31, parentId: 3, name: 'Transactions', iconType:'SVG', icon: 'transactions', link: '/lnd/chnlmanage'},
      {id: 32, parentId: 3, name: 'Peers/Channels', iconType:'SVG', icon: 'world', link: '/lnd/chnlpending'},
      {id: 33, parentId: 3, name: 'Lookup', iconType:'SVG', icon: 'lookup', link: '/lnd/chnlclosed'},
      {id: 34, parentId: 3, name: 'Routing', iconType:'SVG', icon: 'routing', link: '/lnd/chnlbackup'}
    ]},
    {id: 4, parentId: 0, name: 'Advanced', iconType:'SVG', icon: 'advanced', link: '/sconfig'},
    {id: 5, parentId: 0, name: 'Settings', iconType:'SVG', icon: 'settings', link: '/settings'},
    {id: 6, parentId: 0, name: 'Help', iconType:'SVG', icon: 'help', link: '/help'}    
  ],
  CLChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType:'SVG', icon: 'dashboard', link: '/cl/home'},
    {id: 2, parentId: 0, name: 'On Chain', iconType:'SVG', icon: 'on-chain', link:  '/cl/onchain'},
    {id: 3, parentId: 0, name: 'Lightning', iconType:'SVG', icon: 'lightning', link: '/cl/chnlmanage', children: [
      {id: 31, parentId: 3, name: 'Transactions', iconType:'SVG', icon: 'transactions', link: '/cl/chnlmanage'},
      {id: 32, parentId: 3, name: 'Peers/Channels', iconType:'SVG', icon: 'world', link: '/cl/peers'},
      {id: 33, parentId: 3, name: 'Lookup', iconType:'SVG', icon: 'lookup', link: '/cl/lookups'},
      {id: 34, parentId: 3, name: 'Routing', iconType:'SVG', icon: 'routing', link: '/cl/queryroutes'}
    ]},
    {id: 4, parentId: 0, name: 'Advanced', iconType:'SVG', icon: 'advanced', link: '/sconfig'},
    {id: 5, parentId: 0, name: 'Settings', iconType:'SVG', icon: 'settings', link: '/settings'},
    {id: 6, parentId: 0, name: 'Help', iconType:'SVG', icon: 'help', link: '/help'}    
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
