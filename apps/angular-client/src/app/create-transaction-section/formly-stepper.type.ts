import { Component } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'crane-formly-field-stepper',
  template: `
    <mat-vertical-stepper>
      <mat-step
        *ngFor="
          let step of field.fieldGroup;
          let index = index;
          let last = last
        "
      >
        <ng-template matStepLabel>{{
          step.templateOptions?.label
        }}</ng-template>
        <formly-field [field]="step"></formly-field>

        <div>
          <button
            matStepperPrevious
            *ngIf="index !== 0"
            mat-raised-button
            type="button"
          >
            Back
          </button>

          <button
            matStepperNext
            *ngIf="!last"
            mat-raised-button
            color="primary"
            type="button"
            [disabled]="!isValid(step)"
          >
            Next
          </button>

          <button
            *ngIf="last"
            mat-raised-button
            color="primary"
            [disabled]="!form.valid"
            type="submit"
          >
            Submit
          </button>
        </div>
      </mat-step>
    </mat-vertical-stepper>
  `,
})
export class FormlyFieldStepperComponent extends FieldType {
  isValid(field: FormlyFieldConfig): boolean {
    if (field.key) {
      return field.formControl?.valid ?? false;
    }

    return field.fieldGroup
      ? field.fieldGroup.every((f) => this.isValid(f))
      : true;
  }
}
