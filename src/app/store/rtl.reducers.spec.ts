import * as fromRTLReducer from './rtl.reducers';
import * as RTLActions from './rtl.actions';

describe('RTL reducer', () => {
  describe('default action', () => {
    it('should return initial state', () => {
      const { initRootState } = fromRTLReducer;
      const newState = fromRTLReducer.RootReducer(initRootState, { type: 'VOID' });
      expect(newState).toEqual(initRootState);
    });
  });

  describe('Action SetSelectedNode', () => {
    it('should set selected node', () => {
      const { initRootState } = fromRTLReducer;
      const newSelectedNode = { 
        settings: {
          userPersona: 'MERCHANT',
          themeMode: 'NIGHT',
          themeColor: 'TEAL',
          currencyUnits: ['BTC', 'SATS', 'USD'],
          fiatConversion: true,
          bitcoindConfigPath: '',
          enableLogging: true,
          lnServerUrl: '',
          swapServerUrl: '',
          boltzServerUrl: '',
          channelBackupPath: '',
          currencyUnit: ''
        },
        authentication: {
          swapMacaroonPath: '',
          boltzMacaroonPath: '',
          configPath: ''
        },
        index: '1',
        lnNode: 'TEST',
        lnImplementation: 'ROOT'
      };
      const SetSelectedNodeAction = new RTLActions.SetSelelectedNode({ lnNode: newSelectedNode, isInitialSetup: false });
      const newState = fromRTLReducer.RootReducer(initRootState, SetSelectedNodeAction);

      expect(newState.selNode.settings.themeMode).toBe('NIGHT');
      expect(newState.selNode.settings.themeColor).toBe('TEAL');
      expect(newState.selNode.settings.userPersona).toBe('MERCHANT');
      expect(newState.selNode.lnImplementation).toEqual('ROOT');
    });
  });

});
