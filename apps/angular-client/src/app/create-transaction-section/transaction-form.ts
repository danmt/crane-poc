import { FormlyFieldConfig } from '@ngx-formly/core';
import { BehaviorSubject } from 'rxjs';
import { toFormlyFields } from '../utils';
import { InstructionOption } from './instruction-autocomplete.component';

export class TransactionForm {
  private readonly _fields = new BehaviorSubject<FormlyFieldConfig>({
    type: 'stepper',
    fieldGroup: [],
  });
  readonly fields$ = this._fields.asObservable();

  addInstruction({ instruction, name }: InstructionOption) {
    const fields = this._fields.getValue();

    this._fields.next({
      ...fields,
      fieldGroup: [
        ...(fields.fieldGroup ?? []),
        {
          key: (fields.fieldGroup ?? []).length + 1,
          templateOptions: { label: `${name} - ${instruction.name}` },
          fieldGroup: toFormlyFields(instruction),
        },
      ],
    });
  }

  restart() {
    this._fields.next({
      type: 'stepper',
      fieldGroup: [],
    });
  }
}
