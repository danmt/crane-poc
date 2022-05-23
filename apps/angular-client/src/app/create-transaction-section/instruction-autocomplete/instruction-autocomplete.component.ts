import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { PluginsService } from '../../plugins';
import { IdlInstruction } from '../../utils';

export interface InstructionOption {
  namespace: string;
  program: string;
  instruction: IdlInstruction;
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
  options = this._pluginsService.plugins
    .map((plugin) => ({
      namespace: plugin.namespace,
      program: plugin.program,
      instructions: plugin.instructions,
    }))
    .reduce(
      (options: InstructionOption[], plugin) => [
        ...options,
        ...plugin.instructions.map((instruction) => ({
          namespace: plugin.namespace,
          program: plugin.program,
          instruction,
        })),
      ],
      []
    );

  filteredOptions: Observable<InstructionOption[]> | null = null;

  @Output() instructionSelected = new EventEmitter<InstructionOption>();

  constructor(private readonly _pluginsService: PluginsService) {}

  ngOnInit() {
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((value) => this._filter(value))
    );
  }

  private _filter(value: string | InstructionOption | null) {
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

  onInstructionSelected(instruction: InstructionOption) {
    this.instructionSelected.emit(instruction);
  }

  displayWith(data: InstructionOption | null) {
    return data ? data.program + ' ' + data.instruction.name : '';
  }
}
