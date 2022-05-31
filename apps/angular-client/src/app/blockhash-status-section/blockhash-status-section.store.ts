import { Injectable } from '@angular/core';
import { blockhashStatusServiceFactory } from '@crane/machines';
import { ConnectionStore } from '@heavy-duty/wallet-adapter';
import { ComponentStore } from '@ngrx/component-store';
import { concatMap, map, of, pipe, tap, withLatestFrom } from 'rxjs';
import { StateFrom } from 'xstate';
import { isNotNull, Option, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof blockhashStatusServiceFactory>;
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
export class BlockhashStatusSectionStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly percentage$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.percentage ?? null
  );
  readonly isValid$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.isValid ?? null
  );
  readonly lastValidBlockHeight$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState?.context.lastValidBlockHeight ?? null
  );

  constructor(private readonly _connectionStore: ConnectionStore) {
    super(initialState);

    this.start(
      this._connectionStore.connection$.pipe(
        isNotNull,
        map((connection) =>
          blockhashStatusServiceFactory(connection, undefined, undefined, {
            fireAndForget: false,
          })
        )
      )
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

  readonly getSlot = this.effect<Option<number>>(
    pipe(
      concatMap((lastValidBlockHeight) =>
        of(lastValidBlockHeight).pipe(
          withLatestFrom(this.service$),
          tap(([lastValidBlockHeight, service]) => {
            if (service === null || lastValidBlockHeight === null) {
              return;
            }

            service.send({
              type: 'getSlot',
              value: lastValidBlockHeight,
            });
          })
        )
      )
    )
  );
}
