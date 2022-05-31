import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveComponentModule } from '@ngrx/component';
import { BlockhashStatusSectionComponent } from './blockhash-status-section.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveComponentModule,
  ],
  exports: [BlockhashStatusSectionComponent],
  declarations: [BlockhashStatusSectionComponent],
  providers: [],
})
export class BlockhashStatusSectionModule {}
