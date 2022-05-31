import { Component, OnInit } from '@angular/core';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { Transaction, TransactionSignature } from '@solana/web3.js';
import { BehaviorSubject } from 'rxjs';
import { Option } from './utils';

@Component({
  selector: 'crane-root',
  template: `
    <div class="flex justify-between">
      <main class="flex-1">
        <crane-create-transaction-section
          (transactionCreated)="onTransactionCreated($event)"
        >
        </crane-create-transaction-section>
      </main>

      <aside class="w-80">
        <crane-blockhash-status-section
          *ngrxLet="latestBlockhash$; let latestBlockhash"
          [lastValidBlockHeight]="latestBlockhash?.lastValidBlockHeight ?? null"
          (blockhashExpired)="onBlockhashExpired()"
        ></crane-blockhash-status-section>

        <crane-sign-transaction-section
          [transaction]="transaction$ | async"
          [signer]="(authority$ | async) ?? null"
          (transactionSigned)="onTransactionSignDone($event)"
        >
        </crane-sign-transaction-section>

        <crane-send-transaction-button
          [transaction]="transaction$ | async"
          (transactionSent)="onTransactionSent($event)"
        >
        </crane-send-transaction-button>

        <crane-confirm-transaction-button
          [signature]="signature$ | async"
          (transactionConfirmed)="onTransactionConfirmed()"
        >
        </crane-confirm-transaction-button>
      </aside>
    </div>
  `,
  styles: [],
  providers: [ConnectionStore, WalletStore],
})
export class AppComponent implements OnInit {
  private readonly _transaction = new BehaviorSubject<Option<Transaction>>(
    null
  );
  private readonly _latestBlockhash = new BehaviorSubject<
    Option<{ blockhash: string; lastValidBlockHeight: number }>
  >(null);
  private readonly _signature = new BehaviorSubject<
    Option<TransactionSignature>
  >(null);
  readonly connection$ = this._connectionStore.connection$;
  readonly authority$ = this._walletStore.publicKey$;
  readonly transaction$ = this._transaction.asObservable();
  readonly latestBlockhash$ = this._latestBlockhash.asObservable();
  readonly signature$ = this._signature.asObservable();

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);
    this._connectionStore.setEndpoint('http://localhost:8899');
  }

  onTransactionCreated({
    transaction,
    latestBlockhash,
  }: {
    transaction: Option<Transaction>;
    latestBlockhash: Option<{
      blockhash: string;
      lastValidBlockHeight: number;
    }>;
  }) {
    this._latestBlockhash.next(latestBlockhash);
    this._transaction.next(transaction);
  }

  onTransactionSignDone(transaction: Transaction) {
    this._transaction.next(transaction);
  }

  onTransactionSent(signature: TransactionSignature) {
    this._signature.next(signature);
  }

  onTransactionConfirmed() {
    console.log('confirmed');
  }

  onBlockhashExpired() {
    console.log('blockhash expired');
  }
}
