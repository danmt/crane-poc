/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  ViewContainerRef,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import {
  FieldType,
  FormlyExtension,
  FormlyFieldConfig,
  FormlyFormOptions,
} from '@ngx-formly/core';

export interface FormlyFormOptionsCache extends FormlyFormOptions {
  checkExpressions?: (field: FormlyFieldConfig, ingoreCache?: boolean) => void;
  _viewContainerRef?: ViewContainerRef;
  _injector?: Injector;
  _hiddenFieldsForCheck?: FormlyFieldConfigCache[];
  _initialModel?: any;

  /** @deprecated */
  _buildForm?: () => void;

  /** @deprecated */
  _checkField?: (field: FormlyFieldConfig, ingoreCache?: boolean) => void;

  /** @deprecated */
  _markForCheck?: (field: FormlyFieldConfig) => void;
}

export interface FormlyFieldConfigCache extends FormlyFieldConfig {
  form?: FormGroup;
  model?: any;
  formControl?: AbstractControl & {
    _fields?: FormlyFieldConfigCache[];
    _childrenErrors?: { [id: string]: unknown };
  };
  parent?: FormlyFieldConfigCache;
  options?: FormlyFormOptionsCache;
  shareFormControl?: boolean;
  index?: number;
  _elementRefs?: ElementRef[];
  _expressions?: {
    [property: string]: {
      callback: (ingoreCache: boolean) => boolean;
      paths?: string[];
    };
  };
  _hide?: boolean;
  _validators?: ValidatorFn[];
  _asyncValidators?: AsyncValidatorFn[];
  _componentRefs?: (ComponentRef<FieldType> | EmbeddedViewRef<FieldType>)[];
  _proxyInstance?: FormlyExtension;
  _keyPath?: {
    key: FormlyFieldConfig['key'];
    path: string[];
  };
}

export function defineHiddenProp(field: any, prop: string, defaultValue: any) {
  Object.defineProperty(field, prop, {
    enumerable: false,
    writable: true,
    configurable: true,
  });
  field[prop] = defaultValue;
}

export function isNil(value: any) {
  return value == null;
}

export function hasKey(field: FormlyFieldConfig) {
  return !isNil(field.key) && field.key !== '';
}

export function getKeyPath(field: FormlyFieldConfigCache): string[] {
  if (!hasKey(field)) {
    return [];
  }

  /* We store the keyPath in the field for performance reasons. This function will be called frequently. */
  if (field._keyPath?.key !== field.key) {
    let path: (string | number)[] = [];
    if (typeof field.key === 'string') {
      const key =
        field.key.indexOf('[') === -1
          ? field.key
          : field.key.replace(/\[(\w+)\]/g, '.$1');
      path = key.indexOf('.') !== -1 ? key.split('.') : [key];
    } else if (Array.isArray(field.key)) {
      path = field.key.slice(0);
    } else {
      path = [`${field.key}`];
    }

    defineHiddenProp(field, '_keyPath', { key: field.key, path });
  }

  return field._keyPath?.path.slice(0) ?? [];
}

export function getFieldValue(field: FormlyFieldConfig): any {
  let model = field.parent ? field.parent.model : field.model;
  for (const path of getKeyPath(field)) {
    if (!model) {
      return model;
    }
    model = model[path];
  }

  return model;
}

export function unregisterControl(
  field: FormlyFieldConfigCache,
  emitEvent = false
) {
  const control = field.formControl;
  const fieldIndex = control?._fields ? control._fields.indexOf(field) : -1;
  if (fieldIndex !== -1) {
    control?._fields?.splice(fieldIndex, 1);
  }

  const form = control?.parent as FormGroup;
  if (!form) {
    return;
  }

  const opts = { emitEvent };
  if (form instanceof FormArray) {
    const key = form.controls.findIndex((c) => c === control);
    if (key !== -1) {
      form.removeAt(key, opts);
    }
  } else if (form instanceof FormGroup) {
    const paths = getKeyPath(field);
    const key = paths[paths.length - 1];
    if (form.get([key]) === control) {
      form.removeControl(key, opts);
    }
  }
}

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
        <ng-template matStepLabel>
          <div class="w-full flex justify-between items-center">
            <div class="flex items-center gap-2">
              <img
                class="h-5 inline-block"
                [src]="'assets/images/' + model[index].namespace + '.png'"
              />
              <p>
                <span class="uppercase text-xs"
                  >{{ model[index].name }} |
                </span>
              </p>
              <p>
                <span class="text-base">{{ model[index].instruction }} </span>
              </p>
            </div>

            <button
              mat-icon-button
              (click)="remove(index)"
              craneStopPropagation
              type="button"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </ng-template>
        <formly-field [field]="step"></formly-field>

        <div class="mt-4">
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

  remove(index: number) {
    const field = this.field.fieldGroup?.[index];
    if (field === undefined) {
      return;
    }

    unregisterControl(field, true);
    this.field.fieldGroup?.splice(index, 1);
    this.field.fieldGroup?.forEach((f, key) => (f.key = `${key}`));
    delete this.model[`${index}`];
    this._build();
  }

  private _build() {
    this.options?.fieldChanges?.next({
      field: this.field,
      value: getFieldValue(this.field),
      type: 'valueChanges',
    });
  }
}
