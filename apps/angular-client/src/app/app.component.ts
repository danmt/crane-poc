import { Component, OnInit } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { environment } from '../environments/environment';
import { ConnectionService } from './connection.service';

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <main>
      <xstate-create-transaction-button
        [connection]="connection"
        [feePayer]="authority.publicKey"
        [instructions]="instructions"
        (transactionCreated)="onTransactionCreated($event)"
      >
      </xstate-create-transaction-button>
    </main>
  `,
  styles: [],
  providers: [WalletStore],
})
export class AppComponent implements OnInit {
  readonly connection = this._connectionService.connection;
  readonly authority = Keypair.fromSecretKey(
    new Uint8Array(environment.authority)
  );
  readonly instructions = [
    SystemProgram.transfer({
      fromPubkey: this.authority.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    }),
  ];

  constructor(
    private readonly _connectionService: ConnectionService,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);

    this._walletStore.publicKey$.subscribe((a) => console.log(a?.toBase58()));
  }

  onTransactionCreated(transaction: Transaction) {
    console.log(transaction);
  }
}
