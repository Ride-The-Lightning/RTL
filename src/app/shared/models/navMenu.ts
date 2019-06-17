export const MENU_DATA: MenuNode = {
  id: 0,
  parentId: 0,
  name: 'root',
  icon: 'root',
  link: 'root',
  children: [
    {id: 1, parentId: 0, name: 'Home', icon: 'home', link: '/home'},
    {id: 2, parentId: 0, name: 'LND Wallet', icon: 'account_balance_wallet', link:  '/transsendreceive', children: [
      {id: 21, parentId: 2, name: 'Send/Receive', icon: 'compare_arrows', link: '/transsendreceive'},
      {id: 22, parentId: 2, name: 'List Transactions', icon: 'list_alt', link: '/translist'},
    ]},
    {id: 3, parentId: 0, name: 'Peers', icon: 'group', link: '/peers'},
    {id: 4, parentId: 0, name: 'Channels', icon: 'settings_ethernet', link: '/chnlmanage', children: [
      {id: 41, parentId: 4, name: 'Management', icon: 'subtitles', link: '/chnlmanage'},
      {id: 42, parentId: 4, name: 'Pending', icon: 'watch', link: '/chnlpending'},
      {id: 43, parentId: 4, name: 'Closed', icon: 'watch_later', link: '/chnlclosed'},
      {id: 44, parentId: 4, name: 'Backup', icon: 'cloud_circle', link: '/chnlbackup'}
    ]},
    {id: 5, parentId: 0, name: 'Payments', icon: 'payment', link: '/payments'},
    {id: 6, parentId: 0, name: 'Invoices', icon: 'receipt', link: '/invoices'},
    {id: 7, parentId: 0, name: 'Forwarding History', icon: 'timeline', link: '/switch'},
    {id: 8, parentId: 0, name: 'Routing Peers', icon: 'group_work', link: '/routingpeers'},
    {id: 9, parentId: 0, name: 'Lookups', icon: 'search', link: '/lookups'},
    {id: 10, parentId: 0, name: 'Node Config', icon: 'perm_data_setting', link: '/sconfig'},
    {id: 11, parentId: 0, name: 'Help', icon: 'help', link: '/help'}
  ]
};

export class MenuNode {
  id: number;
  parentId: number;
  name?: string;
  icon?: string;
  link?: any;
  children?: MenuNode[];
}

export class FlatMenuNode {
  constructor(public expandable: boolean, public level: number, public id: number, public parentId: number, public name: string, public icon: string, public link: string) {}
}
