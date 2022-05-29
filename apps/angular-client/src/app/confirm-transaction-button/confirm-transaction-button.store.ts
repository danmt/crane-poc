import { Injectable } from '@angular/core';
import { confirmTransactionServiceFactory } from '@crane/machines';
import { ConnectionStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore } from '@ngrx/component-store';
import { TransactionSignature } from '@solana/web3.js';
import { tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, Option, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof confirmTransactionServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;

interface ViewModel {
  service: Option<ServiceType>;
  serviceState: Option<StateType>;
  signature: Option<TransactionSignature>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
  signature: null,
};

@Injectable()
export class ConfirmTransactionButtonStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly signature$ = this.select(({ signature }) => signature);
  readonly disabled$ = this.select(
    this.serviceState$,
    (serviceState) =>
      serviceState === null ||
      !serviceState.can({
        type: 'confirmTransaction',
      })
  );

  constructor(private readonly _connectionStore: ConnectionStore) {
    super(initialState);

    this.start(
      this.select(
        this._connectionStore.connection$.pipe(isNotNull),
        this.signature$.pipe(isNotNull),
        (connection, signature) =>
          confirmTransactionServiceFactory(connection, signature, {
            eager: false,
          })
      )
    );
  }

  readonly setSignature = this.updater<TransactionSignature>(
    (state, signature) => ({
      ...state,
      signature,
    })
  );

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

  readonly confirmTransaction = this.effect<Option<ServiceType>>(
    tap((service) => {
      if (service === null) {
        return;
      }

      service.send({
        type: 'confirmTransaction',
      });
    })
  );
}
