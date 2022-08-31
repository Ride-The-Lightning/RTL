import { ApiCallsListRoot } from '../shared/models/apiCallsPayload';
import { APICallStatusEnum } from '../shared/services/consts-enums-functions';
import { RTLConfiguration, ConfigSettingsNode, GetInfoRoot } from '../shared/models/RTLconfig';

import { LNDState } from '../lnd/store/lnd.state';
import { CLNState } from '../cln/store/cln.state';
import { ECLState } from '../eclair/store/ecl.state';

export interface RootState {
  apiURL: string;
  apisCallStatus: ApiCallsListRoot;
  selNode: ConfigSettingsNode | any;
  appConfig: RTLConfiguration;
  nodeData: GetInfoRoot;
}

const initNodeSettings = { userPersona: 'OPERATOR', themeMode: 'DAY', themeColor: 'PURPLE', channelBackupPath: '', selCurrencyUnit: 'USD', fiatConversion: false, currencyUnits: ['Sats', 'BTC', 'USD'], bitcoindConfigPath: '', enableOffers: false, enablePeerswap: false };
const initNodeAuthentication = { configPath: '', swapMacaroonPath: '', boltzMacaroonPath: '' };

export const initRootState: RootState = {
  apiURL: '',
  apisCallStatus: { Login: { status: APICallStatusEnum.UN_INITIATED }, IsAuthorized: { status: APICallStatusEnum.UN_INITIATED } },
  selNode: { index: 1, lnNode: '', settings: initNodeSettings, authentication: initNodeAuthentication, lnImplementation: 'LND' },
  appConfig: {
    defaultNodeIndex: -1,
    selectedNodeIndex: -1,
    sso: { rtlSSO: 0, logoutRedirectLink: '' },
    enable2FA: false,
    allowPasswordUpdate: true,
    nodes: [{ settings: initNodeSettings, authentication: initNodeAuthentication }]
  },
  nodeData: {}
};

export interface RTLState {
  root: RootState;
  lnd: LNDState;
  cln: CLNState;
  ecl: ECLState;
}
