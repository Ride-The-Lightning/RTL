import * as fromRTLReducer from './rtl.reducers';
import * as RTLActions from './rtl.actions';
import { mockActionsData } from '../shared/test-helpers/test-data';

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
      const SetSelectedNodeAction = new RTLActions.SetSelelectedNode({ lnNode: mockActionsData.setSelectedNode, isInitialSetup: false });
      const newState = fromRTLReducer.RootReducer(initRootState, SetSelectedNodeAction);

      expect(newState.selNode.settings.themeMode).toBe('NIGHT');
      expect(newState.selNode.settings.themeColor).toBe('TEAL');
      expect(newState.selNode.settings.userPersona).toBe('MERCHANT');
      expect(newState.selNode.lnImplementation).toEqual('LND');
    });
  });

});
