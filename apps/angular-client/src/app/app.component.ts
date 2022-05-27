import { Component, OnInit } from '@angular/core';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { Transaction, TransactionSignature } from '@solana/web3.js';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <div class="flex justify-between">
      <main class="flex-1">
        <xstate-create-transaction-section
          (transactionCreated)="onTransactionCreated($event)"
        >
        </xstate-create-transaction-section>

        <section>
          <h2>Sign transaction</h2>

          <xstate-sign-transaction-button
            [transaction]="transaction$ | async"
            [signer]="(authority$ | async) ?? null"
            (transactionSigned)="onTransactionSigned($event)"
          >
          </xstate-sign-transaction-button>
        </section>

        <section>
          <h2>Send transaction</h2>

          <xstate-send-transaction-button
            [transaction]="transaction$ | async"
            (transactionSent)="onTransactionSent($event)"
          >
          </xstate-send-transaction-button>
        </section>

        <section>
          <h2>Confirm transaction</h2>

          <xstate-confirm-transaction-button
            [signature]="signature$ | async"
            (transactionConfirmed)="onTransactionConfirmed()"
          >
          </xstate-confirm-transaction-button>
        </section>
      </main>

      <aside class="w-80">
        <xstate-keypairs-list></xstate-keypairs-list>
      </aside>
    </div>
  `,
  styles: [],
  providers: [ConnectionStore, WalletStore],
})
export class AppComponent implements OnInit {
  private readonly _transaction = new BehaviorSubject<Transaction | null>(null);
  private readonly _signature =
    new BehaviorSubject<TransactionSignature | null>(null);
  readonly connection$ = this._connectionStore.connection$;
  readonly authority$ = this._walletStore.publicKey$;
  readonly transaction$ = this._transaction.asObservable();
  readonly signature$ = this._signature.asObservable();

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);
    this._connectionStore.setEndpoint('http://localhost:8899');
  }

  onTransactionCreated(transaction: Transaction) {
    console.log('transaction created: ', transaction);
    this._transaction.next(transaction);
  }

  onTransactionSigned(transaction: Transaction) {
    this._transaction.next(transaction);
  }

  onTransactionSent(signature: TransactionSignature) {
    this._signature.next(signature);
  }

  onTransactionConfirmed() {
    console.log('confirmed');
  }
}
