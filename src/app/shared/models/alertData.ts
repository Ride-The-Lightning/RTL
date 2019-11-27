export interface InputData {
  placeholder: string;
  inputValue?: string | number | boolean;
  inputType?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface AlertData {
  type: string; // INFORMATION/WARNING/ERROR/SUCCESS/CONFIRM  
  alertTitle?: string;
  titleMessage?: string;
  message?: string;
  messageFieldsBreakdown?: Array<number>;
  noBtnText?: string;
  yesBtnText?: string;
  flgShowInput?: boolean;
  getInputs?: Array<InputData>;
  newlyAdded?: boolean;
  component?: any;
}

export interface DialogConfig {
  width: string;
  data: AlertData;
}
