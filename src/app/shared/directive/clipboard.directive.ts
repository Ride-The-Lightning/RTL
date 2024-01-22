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

    if (!this.payload) return;

    if (navigator.clipboard) {
      this.copyUsingClipboardAPI();
    } else {
      this.copyUsingFallbackMethod();
    }
  }

  private copyUsingFallbackMethod(): void {
    const input = document.createElement('textarea');
    input.innerText = this.payload;
    document.body.appendChild(input);
    input.select();

    try {
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
    navigator.clipboard.writeText(this.payload.toString())
      .then(() => this.copied.emit(this.payload.toString()))
      .catch((error) => this.copied.emit('Error could not copy text: ' + JSON.stringify(error)));
  }
}
