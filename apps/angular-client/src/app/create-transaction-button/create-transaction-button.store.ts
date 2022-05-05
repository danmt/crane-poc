import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createTransactionServiceFactory2 } from '@xstate/machines';
import { combineLatest, filter, map, tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof createTransactionServiceFactory2>;
type StateType = StateFrom<ServiceType['machine']>;
type Some<T> = T | null;

interface ViewModel {
  service: Some<ServiceType>;
  serviceState: Some<StateType>;
  connection: Some<Connection>;
  feePayer: Some<PublicKey>;
  instructions: Some<TransactionInstruction[]>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
  connection: null,
  feePayer: null,
  instructions: null,
};

@Injectable()
export class CreateTransactionButtonStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly connection$ = this.select(({ connection }) => connection);
  readonly feePayer$ = this.select(({ feePayer }) => feePayer);
  readonly instructions$ = this.select(({ instructions }) => instructions);
  readonly disabled$ = this.select(
    this.serviceState$,
    (serviceState) =>
      serviceState === null || !serviceState.can('createTransaction' as any)
  );

  constructor() {
    super(initialState);

    this.start(
      this.connection$.pipe(
        isNotNull,
        map((connection) =>
          createTransactionServiceFactory2(connection, {
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

  readonly setConnection = this.updater<Connection>((state, connection) => ({
    ...state,
    connection,
  }));

  readonly setFeePayer = this.updater<PublicKey>((state, feePayer) => ({
    ...state,
    feePayer,
  }));

  readonly setInstructions = this.updater<TransactionInstruction[]>(
    (state, instructions) => ({
      ...state,
      instructions,
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

  readonly restartMachine = this.effect<ServiceType>(
    tap((service) => service.send('restartMachine'))
  );

  readonly createTransaction = this.effect<{
    service: Some<ServiceType>;
    feePayer: Some<PublicKey>;
    instructions: Some<TransactionInstruction[]>;
  }>(
    tap(({ service, feePayer, instructions }) => {
      if (service === null || feePayer === null || instructions === null) {
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
}
