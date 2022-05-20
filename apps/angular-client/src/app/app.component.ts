import { Component, OnInit } from '@angular/core';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { map } from 'rxjs';
import { isNotNull } from './utils';

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <main *ngIf="authority$ | async as authority">
      <ng-container *ngIf="connection$ | async as connection">
        <xstate-create-transaction-button
          *ngIf="instructions$ | async as instructions"
          [connection]="connection"
          [feePayer]="authority"
          [instructions]="instructions"
          (transactionCreated)="onTransactionCreated($event)"
        >
        </xstate-create-transaction-button>
      </ng-container>

      <xstate-sign-transaction-button
        *ngIf="transaction !== undefined"
        [transaction]="transaction"
        [signer]="authority"
      >
      </xstate-sign-transaction-button>
    </main>
  `,
  styles: [],
  providers: [ConnectionStore, WalletStore],
})
export class AppComponent implements OnInit {
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

  transaction?: Transaction;

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);
    this._connectionStore.setEndpoint('http://localhost:8899');
  }

  onTransactionCreated(transaction: Transaction) {
    this.transaction = transaction;
  }
}
