import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { combineLatest, filter, map, of, take, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { SignTransactionSectionStore } from './sign-transaction-section.store';

@Component({
  selector: 'xstate-sign-transaction-section',
  template: `
    <section class="p-4">
      <h2>Sign transaction</h2>

      <div
        *ngIf="publicKey$ | async as publicKey"
        class="border-2 border-white p-2"
      >
        <p class="overflow-hidden whitespace-nowrap overflow-ellipsis">
          Wallet: {{ publicKey.toBase58() }}
        </p>

        <div class="flex gap-1">
          <button
            mat-raised-button
            color="primary"
            [cdkCopyToClipboard]="publicKey.toBase58()"
          >
            Copy
          </button>

          <button
            *ngIf="transaction$ | async as transaction"
            [disabled]="disabled$ | async"
            mat-raised-button
            color="accent"
            (click)="onSignTransactionWithWallet(transaction)"
          >
            Sign
          </button>
        </div>
      </div>

      <xstate-keypairs-list
        (signTransaction)="onSignTransactionWithKeypair($event)"
      ></xstate-keypairs-list>
    </section>
  `,
  providers: [SignTransactionSectionStore],
})
export class SignTransactionSectionComponent implements OnInit {
  readonly publicKey$ = this._walletStore.publicKey$;
  readonly transaction$ = this._signTransactionSectionStore.transaction$;
  readonly disabled$ = this._signTransactionSectionStore.disabled$;

  @Input() set signer(value: PublicKey | null) {
    if (value !== null) {
      this._signTransactionSectionStore.setSigner(value);
    }
  }
  @Input() set transaction(value: Transaction | null) {
    if (value !== null) {
      this._signTransactionSectionStore.setTransaction(value);
    }
  }

  @Output() transactionSigned = new EventEmitter();

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _signTransactionSectionStore: SignTransactionSectionStore
  ) {}

  ngOnInit() {
    this._signTransactionSectionStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction signed')),
        takeUntil(this._signTransactionSectionStore.destroy$)
      )
      .subscribe(({ context }) =>
        this.transactionSigned.emit(new Transaction(context.transaction))
      );
  }

  onSignTransactionWithWallet(transaction: Transaction) {
    const signTransaction$ = this._walletStore.signTransaction(
      new Transaction(transaction)
    );

    if (signTransaction$ === undefined) {
      throw new Error('Wallet selected cannot sign.');
    }

    this._signTransactionSectionStore.signTransactionWithWallet(
      combineLatest({
        service: this._signTransactionSectionStore.service$,
        publicKey: this._walletStore.publicKey$,
        signature: signTransaction$.pipe(
          map((transaction) => transaction.signature)
        ),
      }).pipe(take(1))
    );
  }

  onSignTransactionWithKeypair(keypair: Keypair) {
    this._signTransactionSectionStore.signTransactionWithKeypair(
      combineLatest({
        service: this._signTransactionSectionStore.service$,
        keypair: of(keypair),
      }).pipe(take(1))
    );
  }
}
