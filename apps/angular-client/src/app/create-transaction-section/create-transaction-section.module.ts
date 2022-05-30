import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { FormlyModule } from '@ngx-formly/core';
import { CreateTransactionSectionComponent } from './create-transaction-section.component';
import { FormlyFieldStepperComponent } from './formly-stepper.type';
import { InstructionAutocompleteModule } from './instruction-autocomplete.module';
import { StopPropagationModule } from './stop-propagation.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    FormlyModule.forChild({
      types: [
        {
          name: 'stepper',
          component: FormlyFieldStepperComponent,
        },
      ],
    }),
    InstructionAutocompleteModule,
    StopPropagationModule,
  ],
  exports: [CreateTransactionSectionComponent],
  declarations: [
    CreateTransactionSectionComponent,
    FormlyFieldStepperComponent,
  ],
})
export class CreateTransactionSectionModule {}
