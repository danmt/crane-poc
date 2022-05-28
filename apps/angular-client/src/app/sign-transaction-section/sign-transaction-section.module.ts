import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { KeypairsSectionModule } from './keypairs-section.module';
import { SignTransactionSectionComponent } from './sign-transaction-section.component';

@NgModule({
  imports: [
    CommonModule,
    ClipboardModule,
    MatButtonModule,
    KeypairsSectionModule,
  ],
  exports: [SignTransactionSectionComponent],
  declarations: [SignTransactionSectionComponent],
})
export class SignTransactionSectionModule {}
