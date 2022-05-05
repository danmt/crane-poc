import { Component } from '@angular/core';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { transactionSenderServiceFactory } from '@xstate/machines';
import { from } from 'rxjs';
import { environment } from '../environments/environment';
import { ConnectionService } from './connection.service';

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <main>
      <xstate-get-latest-blockhash-button
        (requestSuccess)="onGetLatestBlochashSuccess($event)"
        (requestError)="onGetLatestBlochashError($event)"
      ></xstate-get-latest-blockhash-button>

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
})
export class AppComponent {
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

  constructor(private readonly _connectionService: ConnectionService) {}

  onSendTransaction() {
    from(
      transactionSenderServiceFactory(
        this.connection,
        this.instructions,
        this.authority.publicKey,
        this.authority
      ).start()
    ).subscribe(({ context, value, event }) =>
      console.log({ context, value, event })
    );
  }

  onGetLatestBlochashSuccess(response: {
    blockhash: string;
    lastValidBlockHeight: number;
  }) {
    console.log(response);
  }

  onGetLatestBlochashError(error: unknown) {
    console.log(error);
  }

  onTransactionCreated(transaction: Transaction) {
    console.log(transaction);
  }
}
