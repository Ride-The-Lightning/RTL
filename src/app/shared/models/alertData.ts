import { DataTypeEnum } from '../services/consts-enums-functions';
import { GetInfoRoot } from './RTLconfig';
import { GetInfo, Invoice, Channel } from './lndModels';
import { InvoiceCL, GetInfoCL } from './clModels';
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

export interface OpenChannelAlert {
  alertTitle?: string;
  titleMessage?: string;
  message?: { peer: any, information: GetInfo, balance: number };
  newlyAdded?: boolean;
  component?: any;
}

export interface CLOpenChannelAlert {
  alertTitle?: string;
  titleMessage?: string;
  message?: { peer: any, information: GetInfoCL, balance: number };
  newlyAdded?: boolean;
  component?: any;
}

export interface InvoiceInformation {
  invoice: Invoice;
  newlyAdded?: boolean;
  component?: any;
}

export interface CLInvoiceInformation {
  invoice: InvoiceCL;
  newlyAdded?: boolean;
  component?: any;
}

export interface ChannelInformation {
  channel: Invoice;
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

export interface LoopAlert {
  channel: Channel;
  minQuote: LoopQuote;
  maxQuote: LoopQuote;
  component?: any;
}

export interface AlertData {
  type: string; // INFORMATION/WARNING/SUCCESS/ERROR
  alertTitle?: string;
  titleMessage?: string;
  message?: Array<Array<MessageDataField>>;
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
  component?: any;
}

export interface DialogConfig {
  width?: string;
  minHeight?: string;
  data: AlertData | ConfirmationData | ErrorData | OpenChannelAlert | CLOpenChannelAlert | InvoiceInformation | CLInvoiceInformation | ChannelInformation | OnChainAddressInformation | ShowPubkeyData | LoopAlert;
}
