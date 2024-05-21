import { Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[rtlClipboard]'
})
export class ClipboardDirective {

  @Input() payload: string;

  @Output()
  public readonly copied: EventEmitter<string> = new EventEmitter<string>();

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.preventDefault();

    if (!this.payload) { return; }

    if (navigator.clipboard) {
      this.copyUsingClipboardAPI();
    } else {
      this.copyUsingFallbackMethod();
    }
  }

  private copyUsingFallbackMethod(): void {
    const input = document.createElement('textarea');
    input.value = this.payload;
    document.body.appendChild(input);
    input.select();

    try {
      // Allowing deprecated command for older browsers where navigator is not available.
      // For newer browsers where execCommand is deprecated, navigator should be available and this fallback will not be called.
      // eslint-disable-next-line deprecation/deprecation
      const result = document.execCommand('copy');
      if (result) {
        this.copied.emit(this.payload.toString());
      } else {
        this.copied.emit('Error could not copy text.');
      }
    } finally {
      document.body.removeChild(input);
    }
  }

  private copyUsingClipboardAPI(): void {
    navigator.clipboard.writeText(this.payload.toString()).then(() => {
      this.copied.emit(this.payload.toString());
    }).catch((err) => {
      this.copied.emit('Error could not copy text: ' + JSON.stringify(err));
    });
  }

}
