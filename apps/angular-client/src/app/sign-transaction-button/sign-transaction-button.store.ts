import { Injectable } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore } from '@ngrx/component-store';
import { PublicKey, Transaction } from '@solana/web3.js';
import { signTransactionServiceFactory } from '@xstate/machines';
import { lastValueFrom, map, tap } from 'rxjs';
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
export class SignTransactionButtonStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly transaction$ = this.select(({ transaction }) => transaction);
  readonly signer$ = this.select(({ signer }) => signer);
  readonly disabled$ = this.select(
    this.serviceState$,
    this.signer$,
    (serviceState, signer) =>
      serviceState === null ||
      signer === null ||
      !serviceState.can({
        type: 'signTransaction',
        value: signer,
      })
  );

  constructor(private readonly _walletStore: WalletStore) {
    super(initialState);

    this.start(
      this.transaction$.pipe(
        isNotNull,
        map((transaction) =>
          signTransactionServiceFactory(
            transaction,
            (transaction) => {
              const signTransaction$ =
                this._walletStore.signTransaction(transaction);

              if (signTransaction$ === undefined) {
                throw new Error('Wallet cannot sign');
              }

              return lastValueFrom(signTransaction$);
            },
            {
              eager: true,
            }
          )
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

  readonly signTransaction = this.effect<{
    service: Option<ServiceType>;
    signer: Option<PublicKey>;
  }>(
    tap(({ service, signer }) => {
      if (service === null || signer === null) {
        return;
      }

      service.send({
        type: 'signTransaction',
        value: signer,
      });
    })
  );
}
