import { faTachometerAlt, faLink, faBolt, faExchangeAlt, faUsers, faProjectDiagram, faCog, faQuestion, faSearch, faTools } from '@fortawesome/free-solid-svg-icons';

export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/lnd/home'},
    {id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link:  '/lnd/onchain'},
    {id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/lnd/peerschannels', children: [
      {id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/lnd/peerschannels'},
      {id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/lnd/transactions'},
      {id: 33, parentId: 3, name: 'Lookup', iconType: 'FA', icon: faSearch, link: '/lnd/lookups'},
      {id: 34, parentId: 3, name: 'Routing', iconType: 'FA', icon: faProjectDiagram, link: '/lnd/routingpeers'}
    ]},
    {id: 4, parentId: 0, name: 'Advanced', iconType: 'FA', icon: faCog, link: '/sconfig'},
    {id: 5, parentId: 0, name: 'Settings', iconType: 'FA', icon: faTools, link: '/settings'},
    {id: 6, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help'}    
  ],
  CLChildren: [
    {id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/cl/home'},
    {id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link:  '/cl/onchain'},
    {id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/cl/chnlmanage', children: [
      {id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/cl/peers'},
      {id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/cl/chnlmanage'},
      {id: 33, parentId: 3, name: 'Lookup', iconType: 'FA', icon: faSearch, link: '/cl/lookups'},
      {id: 34, parentId: 3, name: 'Routing', iconType: 'FA', icon: faProjectDiagram, link: '/cl/queryroutes'}
    ]},
    {id: 4, parentId: 0, name: 'Advanced', iconType: 'FA', icon: faCog, link: '/sconfig'},
    {id: 5, parentId: 0, name: 'Settings', iconType: 'FA', icon: faTools, link: '/settings'},
    {id: 6, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help'}    
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
