import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { signTransactionServiceFactory } from '@xstate/machines';
import { map, tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof signTransactionServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;
type Option<T> = T | null;

interface ViewModel {
  service: Option<ServiceType>;
  serviceState: Option<StateType>;
  transaction: Option<Transaction>;
  signer: Option<PublicKey>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
  transaction: null,
  signer: null,
};

@Injectable()
export class SignTransactionSectionStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly transaction$ = this.select(({ transaction }) => transaction);
  readonly signatures$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.signatures ?? []
  );
  readonly signer$ = this.select(({ signer }) => signer);
  readonly disabled$ = this.select(
    this.serviceState$,
    this.signer$,
    (serviceState, signer) =>
      serviceState === null ||
      signer === null ||
      !serviceState.can({
        type: 'signTransactionWithWallet',
        value: { publicKey: signer, signature: Buffer.alloc(0) },
      })
  );

  constructor() {
    super(initialState);

    this.start(
      this.transaction$.pipe(
        isNotNull,
        map((transaction) =>
          signTransactionServiceFactory(transaction, {
            eager: true,
          })
        )
      )
    );
  }

  readonly setTransaction = this.updater<Transaction>((state, transaction) => ({
    ...state,
    transaction,
  }));

  readonly setSigner = this.updater<PublicKey>((state, signer) => ({
    ...state,
    signer,
  }));

  readonly start = this.effect<ServiceType>(
    tapEffect((service) => {
      service.start();

      this.patchState({ service });
      service.onTransition((state) => this.patchState({ serviceState: state }));

      return () => {
        service.stop();
      };
    })
  );

  readonly signTransactionWithWallet = this.effect<{
    service: Option<ServiceType>;
    publicKey: Option<PublicKey>;
    signature: Option<Buffer>;
  }>(
    tap(({ service, publicKey, signature }) => {
      if (service === null || publicKey === null || signature === null) {
        return;
      }

      service.send({
        type: 'signTransactionWithWallet',
        value: { publicKey, signature },
      });
    })
  );

  readonly signTransactionWithKeypair = this.effect<{
    service: Option<ServiceType>;
    keypair: Keypair;
  }>(
    tap(({ service, keypair }) => {
      if (service === null) {
        return;
      }

      service.send({
        type: 'signTransactionWithKeypair',
        value: keypair,
      });
    })
  );
}
