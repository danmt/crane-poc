import { Injectable } from '@angular/core';
import { createTransactionServiceFactory } from '@crane/machines';
import { ConnectionStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore } from '@ngrx/component-store';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { combineLatest, filter, map, tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, Option, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof createTransactionServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;

interface ViewModel {
  service: Option<ServiceType>;
  serviceState: Option<StateType>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
};

@Injectable()
export class CreateTransactionSectionStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly feePayer$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.feePayer ?? null
  );
  readonly instructions$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.instructions ?? null
  );
  readonly disabled$ = this.select(
    this.serviceState$,
    this.feePayer$,
    this.instructions$,
    (serviceState, feePayer, instructions) =>
      serviceState === null ||
      feePayer === null ||
      instructions === null ||
      !serviceState.can({
        type: 'createTransaction',
        value: {
          feePayer,
          instructions,
        },
      })
  );

  constructor(private readonly _connectionStore: ConnectionStore) {
    super(initialState);

    this.start(
      this._connectionStore.connection$.pipe(
        isNotNull,
        map((connection) =>
          createTransactionServiceFactory(connection, {
            eager: false,
            autoBuild: true,
            fireAndForget: false,
          })
        )
      )
    );
    this.restartMachine(
      combineLatest({
        service: this.service$.pipe(isNotNull),
        state: this.serviceState$.pipe(
          isNotNull,
          filter((state) => state.matches('Transaction created'))
        ),
      }).pipe(map(({ service }) => service))
    );
  }

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

  readonly restartMachine = this.effect<ServiceType>(
    tap((service) => service.send('restartMachine'))
  );

  readonly createTransaction = this.effect<{
    service: Option<ServiceType>;
    feePayer: Option<PublicKey>;
    instructions: TransactionInstruction[];
  }>(
    tap(({ service, feePayer, instructions }) => {
      if (service === null || feePayer === null) {
        return;
      }

      service.send({
        type: 'createTransaction',
        value: {
          feePayer,
          instructions,
        },
      });
    })
  );

  readonly buildTransaction = this.effect<Option<ServiceType>>(
    tap((service) => {
      if (service === null) {
        return;
      }

      service.send({
        type: 'buildTransaction',
      });
    })
  );

  readonly addInstruction = this.effect<{
    service: Option<ServiceType>;
    instruction: TransactionInstruction;
  }>(
    tap(({ service, instruction }) => {
      if (service === null) {
        return;
      }

      service.send({
        type: 'addInstruction',
        value: instruction,
      });
    })
  );

  readonly setFeePayer = this.effect<{
    service: Option<ServiceType>;
    feePayer: Option<PublicKey>;
  }>(
    tap(({ service, feePayer }) => {
      if (service === null || feePayer === null) {
        return;
      }

      service.send({
        type: 'setFeePayer',
        value: feePayer,
      });
    })
  );
}
