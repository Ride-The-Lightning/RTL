export interface InputData {
  placeholder: string;
  inputValue?: string;
  inputType?: string;
}

export interface AlertData {
  type: string; // INFO/WARN/ERROR/SUCCESS/CONFIRM
  titleMessage?: string;
  message?: string;
  noBtnText?: string;
  yesBtnText?: string;
  flgShowInput?: boolean;
  getInputs?: Array<InputData>;
}
