export const MENU_DATA: MenuRootNode = {
  LNDChildren: [
    {id: 1, parentId: 0, name: 'Home', icon: 'home', link: '/lnd/home'},
    {id: 2, parentId: 0, name: 'LND Wallet', icon: 'account_balance_wallet', link:  '/lnd/transsendreceive', children: [
      {id: 21, parentId: 2, name: 'Send/Receive', icon: 'compare_arrows', link: '/lnd/transsendreceive'},
      {id: 22, parentId: 2, name: 'List Transactions', icon: 'list_alt', link: '/lnd/translist'},
    ]},
    {id: 3, parentId: 0, name: 'Peers', icon: 'group', link: '/lnd/peers'},
    {id: 4, parentId: 0, name: 'Channels', icon: 'settings_ethernet', link: '/lnd/chnlmanage', children: [
      {id: 41, parentId: 4, name: 'Management', icon: 'subtitles', link: '/lnd/chnlmanage'},
      {id: 42, parentId: 4, name: 'Pending', icon: 'watch', link: '/lnd/chnlpending'},
      {id: 43, parentId: 4, name: 'Closed', icon: 'watch_later', link: '/lnd/chnlclosed'},
      {id: 44, parentId: 4, name: 'Backup', icon: 'cloud_circle', link: '/lnd/chnlbackup'}
    ]},
    {id: 5, parentId: 0, name: 'Payments', icon: 'payment', link: '/lnd/paymentsend', children: [
      {id: 51, parentId: 5, name: 'Send', icon: 'send', link: '/lnd/paymentsend'},
      {id: 52, parentId: 5, name: 'Query Routes', icon: 'explore', link: '/lnd/queryroutes'}
    ]},
    {id: 6, parentId: 0, name: 'Invoices', icon: 'receipt', link: '/lnd/invoices'},
    {id: 7, parentId: 0, name: 'Forwarding History', icon: 'timeline', link: '/lnd/switch'},
    {id: 8, parentId: 0, name: 'Routing Peers', icon: 'group_work', link: '/lnd/routingpeers'},
    {id: 9, parentId: 0, name: 'Lookups', icon: 'search', link: '/lnd/lookups'},
    {id: 10, parentId: 0, name: 'Node Config', icon: 'perm_data_setting', link: '../sconfig'},
    {id: 11, parentId: 0, name: 'Help', icon: 'help', link: '../help'}
  ],
  CLChildren: [
    {id: 1, parentId: 0, name: 'Home', icon: 'home', link: '/cl/home'},
    {id: 10, parentId: 0, name: 'Node Config', icon: 'perm_data_setting', link: '../sconfig'},
    {id: 11, parentId: 0, name: 'Help', icon: 'help', link: '../help'}
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
  icon?: string;
  link?: any;
  children?: MenuChildNode[];
}

export class FlatMenuNode {
  constructor(public expandable: boolean, public level: number, public id: number, public parentId: number, public name: string, public icon: string, public link: string) {}
}
