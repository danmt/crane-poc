import { Injectable } from '@angular/core';
import { ConnectionStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore } from '@ngrx/component-store';
import { Transaction } from '@solana/web3.js';
import { sendTransactionServiceFactory } from '@xstate/machines';
import { tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof sendTransactionServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;
type Option<T> = T | null;

interface ViewModel {
  service: Option<ServiceType>;
  serviceState: Option<StateType>;
  transaction: Option<Transaction>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
  transaction: null,
};

@Injectable()
export class SendTransactionButtonStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly transaction$ = this.select(({ transaction }) => transaction);
  readonly disabled$ = this.select(
    this.serviceState$,
    (serviceState) =>
      serviceState === null ||
      !serviceState.can({
        type: 'sendTransaction',
      })
  );

  constructor(private readonly _connectionStore: ConnectionStore) {
    super(initialState);

    this.start(
      this.select(
        this._connectionStore.connection$.pipe(isNotNull),
        this.transaction$.pipe(isNotNull),
        (connection, transaction) =>
          sendTransactionServiceFactory(connection, transaction, {
            eager: false,
          })
      )
    );
  }

  readonly setTransaction = this.updater<Transaction>((state, transaction) => ({
    ...state,
    transaction,
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

  readonly sendTransaction = this.effect<Option<ServiceType>>(
    tap((service) => {
      if (service === null) {
        return;
      }

      service.send({
        type: 'sendTransaction',
      });
    })
  );
}
