import { faTachometerAlt, faLink, faBolt, faExchangeAlt, faUsers, faMapSigns, faQuestion, faSearch, faChartBar, faTools, faProjectDiagram, faDownload, faServer, faPercentage, faInfinity, faUserCheck, faLayerGroup, faBullhorn, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { UserPersonaEnum } from '../services/consts-enums-functions';

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

export class MenuRootNode {

  LNDChildren?: MenuChildNode[];
  CLNChildren?: MenuChildNode[];
  ECLChildren?: MenuChildNode[];

}

export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    { id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/lnd/home', userPersona: UserPersonaEnum.ALL },
    { id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link: '/lnd/onchain', userPersona: UserPersonaEnum.ALL },
    {
      id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/lnd/connections', userPersona: UserPersonaEnum.ALL, children: [
        { id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/lnd/connections', userPersona: UserPersonaEnum.ALL },
        { id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/lnd/transactions', userPersona: UserPersonaEnum.ALL },
        { id: 33, parentId: 3, name: 'Routing', iconType: 'FA', icon: faMapSigns, link: '/lnd/routing', userPersona: UserPersonaEnum.ALL },
        { id: 34, parentId: 3, name: 'Reports', iconType: 'FA', icon: faChartBar, link: '/lnd/reports', userPersona: UserPersonaEnum.ALL },
        { id: 35, parentId: 3, name: 'Graph Lookup', iconType: 'FA', icon: faSearch, link: '/lnd/graph', userPersona: UserPersonaEnum.ALL },
        { id: 36, parentId: 3, name: 'Sign/Verify', iconType: 'FA', icon: faUserCheck, link: '/lnd/messages', userPersona: UserPersonaEnum.ALL },
        { id: 37, parentId: 3, name: 'Backup', iconType: 'FA', icon: faDownload, link: '/lnd/channelbackup', userPersona: UserPersonaEnum.ALL },
        { id: 38, parentId: 3, name: 'Network', iconType: 'FA', icon: faProjectDiagram, link: '/lnd/network', userPersona: UserPersonaEnum.OPERATOR },
        { id: 39, parentId: 3, name: 'Node/Network', iconType: 'FA', icon: faServer, link: '/lnd/network', userPersona: UserPersonaEnum.MERCHANT }
      ]
    },
    {
      id: 4, parentId: 0, name: 'Services', iconType: 'FA', icon: faLayerGroup, link: '/services/loop', userPersona: UserPersonaEnum.ALL, children: [
        { id: 41, parentId: 4, name: 'Loop', iconType: 'FA', icon: faInfinity, link: '/services/loop', userPersona: UserPersonaEnum.ALL },
        { id: 42, parentId: 4, name: 'Boltz', iconType: 'SVG', icon: 'boltzIconBlock', link: '/services/boltz', userPersona: UserPersonaEnum.ALL }
      ]
    },
    { id: 5, parentId: 0, name: 'Node Config', iconType: 'FA', icon: faTools, link: '/config', userPersona: UserPersonaEnum.ALL },
    { id: 6, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help', userPersona: UserPersonaEnum.ALL }
  ],
  CLNChildren: [
    { id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/cln/home', userPersona: UserPersonaEnum.ALL },
    { id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link: '/cln/onchain', userPersona: UserPersonaEnum.ALL },
    {
      id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/cln/connections', userPersona: UserPersonaEnum.ALL, children: [
        { id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/cln/connections', userPersona: UserPersonaEnum.ALL },
        { id: 32, parentId: 3, name: 'Liquidity Ads', iconType: 'FA', icon: faBullhorn, link: '/cln/liquidityads', userPersona: UserPersonaEnum.ALL },
        { id: 33, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/cln/transactions', userPersona: UserPersonaEnum.ALL },
        { id: 34, parentId: 3, name: 'Routing', iconType: 'FA', icon: faMapSigns, link: '/cln/routing', userPersona: UserPersonaEnum.ALL },
        { id: 35, parentId: 3, name: 'Reports', iconType: 'FA', icon: faChartBar, link: '/cln/reports', userPersona: UserPersonaEnum.ALL },
        { id: 36, parentId: 3, name: 'Graph Lookup', iconType: 'FA', icon: faSearch, link: '/cln/graph', userPersona: UserPersonaEnum.ALL },
        { id: 37, parentId: 3, name: 'Sign/Verify', iconType: 'FA', icon: faUserCheck, link: '/cln/messages', userPersona: UserPersonaEnum.ALL },
        { id: 38, parentId: 3, name: 'Fee Rates', iconType: 'FA', icon: faPercentage, link: '/cln/rates', userPersona: UserPersonaEnum.OPERATOR },
        { id: 39, parentId: 3, name: 'Node/Fee Rates', iconType: 'FA', icon: faServer, link: '/cln/rates', userPersona: UserPersonaEnum.MERCHANT }
      ]
    },
    {
      id: 4, parentId: 0, name: 'Services', iconType: 'FA', icon: faLayerGroup, link: '/services/loop', userPersona: UserPersonaEnum.ALL, children: [
        //{ id: 41, parentId: 4, name: 'Peerswap', iconType: 'FA', icon: faHandshake, link: '/services/peerswap', userPersona: UserPersonaEnum.ALL },
        { id: 42, parentId: 4, name: 'Boltz', iconType: 'SVG', icon: 'boltzIconBlock', link: '/services/boltz', userPersona: UserPersonaEnum.ALL }
      ]
    },
    { id: 5, parentId: 0, name: 'Node Config', iconType: 'FA', icon: faTools, link: '/config', userPersona: UserPersonaEnum.ALL },
    { id: 6, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help', userPersona: UserPersonaEnum.ALL }
  ],
  ECLChildren: [
    { id: 1, parentId: 0, name: 'Dashboard', iconType: 'FA', icon: faTachometerAlt, link: '/ecl/home', userPersona: UserPersonaEnum.ALL },
    { id: 2, parentId: 0, name: 'On-chain', iconType: 'FA', icon: faLink, link: '/ecl/onchain', userPersona: UserPersonaEnum.ALL },
    {
      id: 3, parentId: 0, name: 'Lightning', iconType: 'FA', icon: faBolt, link: '/ecl/connections', userPersona: UserPersonaEnum.ALL, children: [
        { id: 31, parentId: 3, name: 'Peers/Channels', iconType: 'FA', icon: faUsers, link: '/ecl/connections', userPersona: UserPersonaEnum.ALL },
        { id: 32, parentId: 3, name: 'Transactions', iconType: 'FA', icon: faExchangeAlt, link: '/ecl/transactions', userPersona: UserPersonaEnum.ALL },
        { id: 33, parentId: 3, name: 'Routing', iconType: 'FA', icon: faMapSigns, link: '/ecl/routing', userPersona: UserPersonaEnum.ALL },
        { id: 34, parentId: 3, name: 'Reports', iconType: 'FA', icon: faChartBar, link: '/ecl/reports', userPersona: UserPersonaEnum.ALL },
        { id: 35, parentId: 3, name: 'Graph Lookup', iconType: 'FA', icon: faSearch, link: '/ecl/graph', userPersona: UserPersonaEnum.ALL }
      ]
    },
    { id: 4, parentId: 0, name: 'Node Config', iconType: 'FA', icon: faTools, link: '/config', userPersona: UserPersonaEnum.ALL },
    { id: 5, parentId: 0, name: 'Help', iconType: 'FA', icon: faQuestion, link: '/help', userPersona: UserPersonaEnum.ALL }
  ]
};
