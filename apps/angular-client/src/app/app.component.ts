import { Component } from '@angular/core';
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
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
    </main>
  `,
  styles: [],
})
export class AppComponent {
  constructor(private readonly _connectionService: ConnectionService) {}

  onSendTransaction() {
    const authority = Keypair.fromSecretKey(
      new Uint8Array(environment.authority)
    );

    from(
      transactionSenderServiceFactory(
        this._connectionService.connection,
        [
          SystemProgram.transfer({
            fromPubkey: authority.publicKey,
            toPubkey: Keypair.generate().publicKey,
            lamports: 0.1 * LAMPORTS_PER_SOL,
          }),
        ],
        authority.publicKey,
        authority
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
}
