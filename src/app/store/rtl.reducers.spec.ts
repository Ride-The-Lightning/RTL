import { mockActionsData } from '../shared/test-helpers/test-data';
import { UI_MESSAGES } from '../shared/services/consts-enums-functions';

import { initRootState } from './rtl.state';
import { RootReducer } from './rtl.reducers';
import { setSelelectedNode } from './rtl.actions';

describe('RTL reducer', () => {
  describe('default action', () => {
    it('should return initial state', () => {
      const newState = RootReducer(initRootState, { type: 'VOID' });
      expect(newState).toEqual(initRootState);
    });
  });

  describe('Action SetSelectedNode', () => {
    it('should set selected node', () => {
      const SetSelectedNodeAction = setSelelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, lnNode: mockActionsData.setSelectedNode, isInitialSetup: false } });
      const newState = RootReducer(initRootState, SetSelectedNodeAction);

      expect(newState.selNode.settings.themeMode).toBe('NIGHT');
      expect(newState.selNode.settings.themeColor).toBe('TEAL');
      expect(newState.selNode.settings.userPersona).toBe('MERCHANT');
      expect(newState.selNode.lnImplementation).toEqual('LND');
    });
  });
});
