import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createTransactionServiceFactory } from '@xstate/machines';
import { combineLatest, filter, map, tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, Option, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof createTransactionServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;

interface ViewModel {
  service: Option<ServiceType>;
  serviceState: Option<StateType>;
  connection: Option<Connection>;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
  connection: null,
};

@Injectable()
export class CreateTransactionSectionStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly connection$ = this.select(({ connection }) => connection);
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
      !serviceState.can('buildTransaction')
  );

  constructor() {
    super(initialState);

    this.start(
      this.connection$.pipe(
        isNotNull,
        map((connection) =>
          createTransactionServiceFactory(connection, {
            eager: true,
            autoBuild: false,
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

  readonly setConnection = this.updater<Option<Connection>>(
    (state, connection) => ({
      ...state,
      connection,
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
