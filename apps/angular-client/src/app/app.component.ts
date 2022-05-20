import { Component, OnInit } from '@angular/core';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { BehaviorSubject, map } from 'rxjs';
import { isNotNull } from './utils';

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <main>
      <section>
        <h2>Create transaction</h2>

        <xstate-create-transaction-button
          [connection]="(connection$ | async) ?? null"
          [feePayer]="(authority$ | async) ?? null"
          [instructions]="(instructions$ | async) ?? null"
          (transactionCreated)="onTransactionCreated($event)"
        >
        </xstate-create-transaction-button>
      </section>

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
  readonly instructions$ = this.authority$.pipe(
    isNotNull,
    map((authority) => [
      SystemProgram.transfer({
        fromPubkey: authority,
        toPubkey: Keypair.generate().publicKey,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      }),
    ])
  );
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
