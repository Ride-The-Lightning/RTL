import { Directive, Input } from "@angular/core";
import { NG_VALIDATORS, Validator, Validators, AbstractControl } from '@angular/forms';

@Directive({
    selector: "input[max]",
    providers: [{provide: NG_VALIDATORS, useExisting: MaxValidator, multi: true}]
})
export class MaxValidator implements Validator {
  @Input() max:number;

  validate(control: AbstractControl): any {
    return this.max ? Validators.max(+this.max)(control) : null;
  }
}