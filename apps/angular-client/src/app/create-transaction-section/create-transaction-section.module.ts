import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FormlyModule } from '@ngx-formly/core';
import { CreateTransactionSectionComponent } from './create-transaction-section.component';
import { InstructionAutocompleteModule } from './instruction-autocomplete';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    FormlyModule.forChild(),
    InstructionAutocompleteModule,
  ],
  exports: [CreateTransactionSectionComponent],
  declarations: [CreateTransactionSectionComponent],
})
export class CreateTransactionSectionModule {}
