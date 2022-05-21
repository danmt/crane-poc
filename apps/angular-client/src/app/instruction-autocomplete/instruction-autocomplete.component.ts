import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import associatedTokenAccountIdl from '../../assets/idls/solana/associated-token-account.json';
import tokenProgramIdl from '../../assets/idls/solana/token-program.json';

export interface IdlInstruction {
  program: string;
  instruction: {
    name: string;
    accounts: {
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }[];
    args: (
      | {
          name: string;
          type: string;
        }
      | {
          name: string;
          type: {
            defined: string;
          };
        }
    )[];
  };
}

@Component({
  selector: 'xstate-instruction-autocomplete',
  template: `
    <form class="example-form">
      <mat-form-field class="w-full" appearance="fill">
        <mat-label>Instruction</mat-label>
        <input
          type="text"
          placeholder="Pick one"
          aria-label="Instruction"
          matInput
          [formControl]="searchControl"
          [matAutocomplete]="auto"
        />
        <mat-autocomplete
          autoActiveFirstOption
          #auto="matAutocomplete"
          (optionSelected)="onInstructionSelected($event.option.value)"
          [displayWith]="displayWith"
        >
          <mat-option
            *ngFor="let option of filteredOptions | async"
            [value]="option"
          >
            {{ option.program }} {{ option.instruction.name }}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
    </form>
  `,
})
export class InstructionAutocompleteComponent implements OnInit {
  searchControl = new FormControl();
  options = [
    ...tokenProgramIdl.instructions.map((instruction) => ({
      program: tokenProgramIdl.name,
      instruction,
    })),
    ...associatedTokenAccountIdl.instructions.map((instruction) => ({
      program: associatedTokenAccountIdl.name,
      instruction,
    })),
  ];
  filteredOptions: Observable<IdlInstruction[]> | null = null;

  @Output() instructionSelected = new EventEmitter<IdlInstruction>();

  ngOnInit() {
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((value) => this._filter(value))
    );
  }

  private _filter(value: string | IdlInstruction | null) {
    if (value === null) {
      return this.options;
    } else if (typeof value === 'string') {
      const segments = value.toLowerCase().split(' ');

      return this.options.filter((option) => {
        return segments.every(
          (segment) =>
            option.program.toLowerCase().includes(segment) ||
            option.instruction.name.toLowerCase().includes(segment)
        );
      });
    } else {
      return [value];
    }
  }

  onInstructionSelected(instruction: IdlInstruction) {
    this.instructionSelected.emit(instruction);
  }

  displayWith(data: IdlInstruction | null) {
    return data ? data.program + ' ' + data.instruction.name : '';
  }
}
