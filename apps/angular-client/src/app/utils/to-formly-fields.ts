import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { capital } from 'case';
import { IdlInstruction, IdlInstructionArgument } from '../plugins';
import { PublicKeyValidator } from './public-key.validator';

const isRequired = (arg: IdlInstructionArgument) => {
  return typeof arg.type === 'string' || 'defined' in arg.type;
};

const isPublicKey = (arg: IdlInstructionArgument) => {
  return (
    arg.type === 'publicKey' ||
    (typeof arg.type !== 'string' &&
      'option' in arg.type &&
      arg.type.option === 'publicKey') ||
    (typeof arg.type !== 'string' &&
      'coption' in arg.type &&
      arg.type.coption === 'publicKey')
  );
};

const getArgumentValidators = (arg: IdlInstructionArgument) => {
  const validators: { [key: string]: unknown } = {};

  if (isRequired(arg)) {
    validators['required'] = {
      expression: (control: FormControl) => control.value !== null,
      message: () => `"${capital(arg.name)}" is mandatory.`,
    };
  }

  if (isPublicKey(arg)) {
    validators['publicKey'] = {
      expression: (control: FormControl) =>
        control.value !== null && PublicKeyValidator(control) === null,
      message: (_: unknown, field: FormlyFieldConfig) =>
        `"${field.formControl?.value}" is not a valid Public Key.`,
    };
  }

  return validators;
};

export const toFormlyFields = (
  instruction: IdlInstruction
): FormlyFieldConfig[] => {
  return [
    {
      key: 'accounts',
      templateOptions: { label: 'Accounts' },
      fieldGroup: instruction.accounts.map((account) => ({
        key: account.name,
        type: 'input',
        templateOptions: {
          label: capital(account.name),
          placeholder: account.name,
          description: `Enter Public Key for account ${account.name}.`,
          required: true,
        },
        validators: {
          required: {
            expression: (control: FormControl) => control.value !== null,
            message: () => `"${capital(account.name)}" is mandatory.`,
          },
          publicKey: {
            expression: (control: FormControl) =>
              control.value !== null && PublicKeyValidator(control) === null,
            message: (_: unknown, field: FormlyFieldConfig) =>
              `"${field.formControl?.value}" is not a valid Public Key.`,
          },
        },
      })),
    },
    {
      key: 'args',
      templateOptions: { label: 'Args' },
      fieldGroup: instruction.args.map((arg) => ({
        key: arg.name,
        type: 'input',
        templateOptions: {
          label: capital(arg.name),
          placeholder: arg.name,
          required: isRequired(arg),
        },
        validators: getArgumentValidators(arg),
      })),
    },
  ];
};
