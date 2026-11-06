// Runs a component's CSV export and returns the text of the file it would download, without
// starting a real download.
export const captureCSVDownload = async (startDownload: () => void): Promise<string> => {
  let blob: Blob | undefined;
  spyOn(URL, 'createObjectURL').and.callFake((obj: Blob) => {
    blob = obj;
    return 'blob:csv-test';
  });
  spyOn(HTMLAnchorElement.prototype, 'click');
  startDownload();
  return blob ? (await blob.text()).replace(/^﻿/, '') : '';
};
