import { Component, OnInit } from '@angular/core';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import { transactionProcessorServiceFactory } from '@xstate/machines';
import { from } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'xstate-root',
  template: ` Testing xstate `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'angular-client';

  ngOnInit() {
    const connection = new Connection('http://localhost:8899');
    const authority = Keypair.fromSecretKey(
      new Uint8Array(environment.authority)
    );
    const transactionProcessorService = transactionProcessorServiceFactory(
      connection,
      [
        SystemProgram.transfer({
          fromPubkey: authority.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 0.1 * LAMPORTS_PER_SOL,
        }),
      ],
      authority.publicKey,
      authority
    );

    from(transactionProcessorService).subscribe(({ context, value }) =>
      console.log({ context, value })
    );
  }
}
