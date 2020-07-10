import { DataTypeEnum, SwapTypeEnum } from '../services/consts-enums-functions';
import { GetInfoRoot, RTLConfiguration } from './RTLconfig';
import { GetInfo, Invoice, Channel, Peer } from './lndModels';
import { Invoice as InvoiceCL, GetInfo as GetInfoCL, Peer as PeerCL, Channel as ChannelCL } from './clModels';
import { GetInfo as GetInfoECL, Peer as PeerECL, Channel as ChannelECL, Invoice as InvoiceECL, PaymentSent as PaymentSentECL } from './eclModels';
import { LoopQuote } from './loopModels';

export interface MessageErrorField {
  code: number;
  message: string | any;
  URL: string;
}

export interface MessageDataField {
  key: string;
  value: any;
  title: string;
  width: number;
  type?: DataTypeEnum;
}

export interface InputData {
  placeholder: string;
  inputValue?: string | number | boolean;
  inputType?: string;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
}

export interface OnChainSendFunds {
  sweepAll: boolean;
  component?: any;
}

export interface OpenChannelAlert {
  alertTitle?: string;
  titleMessage?: string;
  message?: { information: GetInfo, balance: number, peer?: Peer, peers?: Peer[] };
  component?: any;
}

export interface CLOpenChannelAlert {
  alertTitle?: string;
  titleMessage?: string;
  message?: { information: GetInfoCL, balance: number, peer?: PeerCL, peers?: PeerCL[] };
  newlyAdded?: boolean;
  component?: any;
}

export interface ECLOpenChannelAlert {
  alertTitle?: string;
  titleMessage?: string;
  message?: { information: GetInfoECL, balance: number, peer?: PeerECL, peers?: PeerECL[] };
  newlyAdded?: boolean;
  component?: any;
}

export interface InvoiceInformation {
  invoice: Invoice;
  newlyAdded?: boolean;
  pageSize: number;
  component?: any;
}

export interface CLInvoiceInformation {
  invoice: InvoiceCL;
  newlyAdded?: boolean;
  pageSize: number;
  component?: any;
}

export interface ECLInvoiceInformation {
  invoice: InvoiceECL;
  newlyAdded?: boolean;
  pageSize: number;
  component?: any;
}

export interface ECLPaymentInformation {
  payment: PaymentSentECL;
  component?: any;
}

export interface ChannelInformation {
  channel: Channel;
  showCopy?: boolean;
  component?: any;
}

export interface CLChannelInformation {
  channel: ChannelCL;
  showCopy?: boolean;
  component?: any;
}

export interface ECLChannelInformation {
  channel: ChannelECL;
  channelsType?: string;
  component?: any;
}

export interface OnChainAddressInformation {
  alertTitle?: string;
  address: string;
  addressType: string;
  component?: any;
}

export interface ShowPubkeyData {
  information: GetInfoRoot;
  component?: any;
}

export interface LoginTokenData {
  authRes: {token: string};
  component?: any;
}

export interface LoopAlert {
  channel: Channel;
  minQuote: LoopQuote;
  maxQuote: LoopQuote;
  direction?: SwapTypeEnum;
  component?: any;
}

export interface AlertData {
  type: string; // INFORMATION/WARNING/SUCCESS/ERROR
  alertTitle?: string;
  titleMessage?: string;
  message?: Array<Array<MessageDataField>>;
  scrollable?: boolean;
  showQRName?: string;
  showQRField?: string;
  newlyAdded?: boolean;
  showCopyName?: string;
  showCopyField?: string;
  component?: any;
  openedBy?: string;
}

export interface ConfirmationData {
  type: string; // INFORMATION/WARNING/SUCCESS/ERROR
  alertTitle?: string;
  titleMessage?: string;
  message?: any;
  scrollable?: boolean;
  noBtnText?: string;
  yesBtnText?: string;
  flgShowInput?: boolean;
  getInputs?: Array<InputData>;
  component?: any;
}

export interface ErrorData {
  alertTitle?: string;
  titleMessage?: string;
  message?: MessageErrorField;
  scrollable?: boolean;
  component?: any;
}

export interface AuthConfig {
  appConfig?: RTLConfiguration;
  component?: any;
}

export interface DialogConfig {
  width?: string;
  maxWidth?: string;
  minHeight?: string;
  data: AlertData | ConfirmationData | ErrorData | OpenChannelAlert | CLOpenChannelAlert | InvoiceInformation | CLInvoiceInformation | ECLInvoiceInformation | ECLPaymentInformation | ChannelInformation | CLChannelInformation | OnChainAddressInformation | ShowPubkeyData | LoopAlert | AuthConfig | LoginTokenData | OnChainSendFunds | ECLChannelInformation | ECLOpenChannelAlert;
}
