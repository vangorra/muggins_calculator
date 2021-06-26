import {FormControl} from "@angular/forms";

export interface TypedFormControl<T> extends FormControl {
  readonly value: T;
  setValue(value: T, options?: Object): void;
}
