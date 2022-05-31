import { Component, Input, Output } from '@angular/core';
import { filter } from 'rxjs';
import { Option } from '../utils';
import { BlockhashStatusSectionStore } from './blockhash-status-section.store';

@Component({
  selector: 'crane-blockhash-status-section',
  template: `
    <section
      class="p-4"
      *ngrxLet="lastValidBlockHeight$; let lastValidBlockHeight"
    >
      <div
        class="px-4 py-2 border-2 border-white flex justify-between items-center"
        *ngrxLet="percentage$; let percentage"
      >
        <header>
          <h2>Blockhash Status</h2>
          <ng-container
            *ngIf="percentage !== null && lastValidBlockHeight !== null"
          >
            <p *ngIf="percentage >= 50" class="text-xs text-green-500">
              Blockhash is valid.
            </p>
            <p
              *ngIf="percentage >= 20 && percentage < 50"
              class="text-xs text-yellow-500"
            >
              Blockhash is expiring.
            </p>
            <p
              *ngIf="percentage > 0 && percentage < 20"
              class="text-xs text-orange-500"
            >
              Blockhash is about to expire.
            </p>
            <p *ngIf="percentage === 0" class="text-xs text-red-500">
              Blockhash expired.
            </p>
          </ng-container>

          <p
            *ngIf="lastValidBlockHeight === null"
            class="text-xs text-gray-400"
          >
            Empty blockhash.
          </p>
        </header>

        <ng-container
          *ngIf="lastValidBlockHeight !== null && percentage !== null"
        >
          <mat-progress-spinner
            *ngIf="percentage > 0"
            class="-scale-x-100"
            diameter="24"
            color="primary"
            mode="determinate"
            [value]="percentage"
          >
          </mat-progress-spinner>
          <mat-icon *ngIf="percentage === 0" class="text-red-500 leading-none">
            cancel
          </mat-icon>
        </ng-container>
      </div>
    </section>
  `,
  providers: [BlockhashStatusSectionStore],
})
export class BlockhashStatusSectionComponent {
  readonly percentage$ = this._blockhashStatusSectionStore.percentage$;
  readonly isValid$ = this._blockhashStatusSectionStore.isValid$;
  readonly lastValidBlockHeight$ =
    this._blockhashStatusSectionStore.lastValidBlockHeight$;

  @Input() set lastValidBlockHeight(value: Option<number>) {
    if (value !== null) {
      this._blockhashStatusSectionStore.getSlot(value);
    }
  }
  @Output() blockhashExpired =
    this._blockhashStatusSectionStore.serviceState$.pipe(
      filter((state) => state?.matches('Slot invalid') ?? false)
    );

  constructor(
    private readonly _blockhashStatusSectionStore: BlockhashStatusSectionStore
  ) {}
}
