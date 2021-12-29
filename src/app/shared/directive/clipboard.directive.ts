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
    if (!this.payload || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(this.payload.toString()).then(() => {
      this.copied.emit(this.payload.toString());
    }, (err) => {
      this.copied.emit('Error could not copy text: ' + JSON.stringify(err));
    });
  }

}
