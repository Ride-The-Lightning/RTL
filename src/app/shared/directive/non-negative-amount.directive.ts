import { Directive, Input } from "@angular/core";
import { Validator, AbstractControl, NG_VALIDATORS } from "@angular/forms";

@Directive({
    selector: "[nonNegativeAmount]",
    providers: [{
        provide: NG_VALIDATORS,
        useExisting: NonNegativeAmountValidator,
        multi: true
    }]
})
export class NonNegativeAmountValidator implements Validator {
  @Input('nonNegativeAmount') nonNegativeAmount: number;

  validate(c: AbstractControl): any {
    return (this.nonNegativeAmount && (this.nonNegativeAmount - +c.value < 0 )) ? { 'negative' : true } : null;
  }
}