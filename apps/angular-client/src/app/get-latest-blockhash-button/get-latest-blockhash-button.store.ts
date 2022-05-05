import { EventEmitter, Injectable, Output } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { getLatestBlockhashServiceFactory } from '@xstate/machines';
import { combineLatest, filter, map, tap } from 'rxjs';
import { StateFrom } from 'xstate';
import { ConnectionService } from '../connection.service';
import { isNotNull, tapEffect } from '../utils';

type ServiceType = ReturnType<typeof getLatestBlockhashServiceFactory>;
type StateType = StateFrom<ServiceType['machine']>;

interface ViewModel {
  service: ServiceType | null;
  serviceState: StateType | null;
}

const initialState: ViewModel = {
  service: null,
  serviceState: null,
};

@Injectable()
export class GetLatestBlockhashButtonStore extends ComponentStore<ViewModel> {
  readonly service$ = this.select(({ service }) => service);
  readonly serviceState$ = this.select(({ serviceState }) => serviceState);
  readonly disabled$ = this.select(
    this.serviceState$,
    (serviceState) => serviceState === null || !serviceState.can('request')
  );

  @Output() requestSuccess = new EventEmitter<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>();
  @Output() requestError = new EventEmitter();

  constructor(private readonly _connectionService: ConnectionService) {
    super(initialState);

    this.start(
      getLatestBlockhashServiceFactory(this._connectionService.connection, {
        eager: false,
        fireAndForget: false,
      })
    );
    this.restartMachine(
      combineLatest({
        service: this.service$.pipe(isNotNull),
        state: this.serviceState$.pipe(
          isNotNull,
          filter((state) => state.matches('Request succeeded'))
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

  readonly request = this.effect<ServiceType | null>(
    tap((service) => {
      if (service !== null) {
        service.send({ type: 'request' });
      }
    })
  );

  readonly restartMachine = this.effect<ServiceType>(
    tap((service) => service.send('restartMachine'))
  );
}
