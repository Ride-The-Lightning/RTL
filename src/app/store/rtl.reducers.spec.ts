import { mockActionsData } from '../shared/test-helpers/test-data';

import { initRootState } from './rtl.state';
import { RootReducer } from './rtl.reducers';
import { resetRootStore } from './rtl.actions';

describe('RTL reducer', () => {
  describe('default action', () => {
    it('should return initial state', () => {
      const newState = RootReducer(initRootState, { type: 'VOID' });
      expect(newState).toEqual(initRootState);
    });
  });

  describe('Action Reset Root Store', () => {
    it('should reset root store with new setup', () => {
      const ResetRootStoreAction = resetRootStore({ payload: mockActionsData.setSelectedNode });
      const newState = RootReducer(initRootState, ResetRootStoreAction);

      expect(newState.selNode.settings.themeMode).toBe('NIGHT');
      expect(newState.selNode.settings.themeColor).toBe('TEAL');
      expect(newState.selNode.settings.userPersona).toBe('MERCHANT');
      expect(newState.selNode.lnImplementation).toEqual('LND');
    });
  });
});
