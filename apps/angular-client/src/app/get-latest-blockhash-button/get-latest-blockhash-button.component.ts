import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { filter, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { GetLatestBlockhashButtonStore } from './get-latest-blockhash-button.store';

@Component({
  selector: 'xstate-get-latest-blockhash-button',
  template: `
    <button
      (click)="onRequest()"
      [disabled]="disabled$ | async"
      class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
    >
      Get Latest Blockhash
    </button>
  `,
  providers: [GetLatestBlockhashButtonStore],
})
export class GetLatestBlockhashButtonComponent implements OnInit {
  readonly disabled$ = this._getLatestBlockhashButtonStore.disabled$;

  @Output() requestSuccess = new EventEmitter<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>();
  @Output() requestError = new EventEmitter();

  constructor(
    private readonly _getLatestBlockhashButtonStore: GetLatestBlockhashButtonStore
  ) {}

  ngOnInit() {
    this._getLatestBlockhashButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Request succeeded')),
        takeUntil(this._getLatestBlockhashButtonStore.destroy$)
      )
      .subscribe(({ context }) => this.requestSuccess.emit(context.response));

    this._getLatestBlockhashButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Sleeping')),
        takeUntil(this._getLatestBlockhashButtonStore.destroy$)
      )
      .subscribe(({ context }) => this.requestError.emit(context.error));
  }

  onRequest() {
    this._getLatestBlockhashButtonStore.request(
      this._getLatestBlockhashButtonStore.service$
    );
  }
}
