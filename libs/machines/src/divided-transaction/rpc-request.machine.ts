import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const rpcRequestServiceFactory = <T>(
  request: () => Promise<T>,
  config?: {
    eager: boolean;
    fireAndForget: boolean;
  }
) => {
  const rpcRequestModel = createModel(
    {
      response: undefined as T | undefined,
      error: undefined as unknown,
    },
    {
      events: {
        request: () => ({}),
        respond: () => ({}),
        restartMachine: () => ({}),
      },
    }
  );

  type RpcRequestMachineServices = {
    'Send request': {
      data: T;
    };
  };

  const rpcRequestMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QCUAOBjABMsBHArnAC6YCyAhugBYCWAdmAHQCSEANmAMQBOehsRRKFQB7WDSI0RdISAAeiALQAWAJwA2RgEYAHMuVaArIYAMh1QGYA7MoA0IAJ5KL1xmuUAmdVquGr6w2UdAF9g+zQsHAJiMkpaBhZ2LllRcUlpWQUERR0rD20TC0LDCy1VZV8Peydsjx1DRlMvf09fE1UtUPCMbD4Yimp6JgBlMDoIeihe6IFOCGkmegA3EQBrJgjp-hIB+JGxibopqO2EZZF0cnS6AG0TAF0UsQkpGSR5JQ8rC0ZVKxN1DoPEYDCYrFZqkoyg0ATp1F9lCY1KoPIYQmEQJsTv04kNGKNxpMtsROGBuNwRNxGKg2FcAGaUgC2jCxfQEsUGCQJh2ObKIZzoK0u1zuj3eqReGXeWRyQMYcOMPmULhcOlUkOyRhMjAsHgs6nKXz0RRM6O6kT5HL2LMtsHw6HQYEgkB4xHI3CIuyGTzSr0ySlymjRGlUfmMwOsGsUph0jVUYK06iKHi8OnqXUxPWx7K9CWzJDtDqdEBdPslb1AMpBjEKPjhqiBafUVnVjiUQVUNfj-109TMegzrJmO1xXI4YFQk04cgEVyY5DpRDJAApTCYTABKThD7ZWvHDceTo5l67+2p5Lu63yWKxlUPqKNWWNA6yGFOI-TI0IYugiEvwd4dxxTkmFYDgTz9aUA10RgWzMMotCRTwgijCx40aNFlDfcpvl0DxByzS1c32QkjmJAQIKlSslEMdRtURUpAh0EwPBDCwoxTKwa0BAJ1CCU010MAiLWHPc81te1HWdCBKIrD5shKTtmyKeo7z8fQozfLQuwTawQSCM1MxE3diJtUS6XIGgOBk8VnlPKCFIsWMWwNVjLGVdSNQaZt4SclEG2vFNhPIkcQPxQ9Jlks9ow8bUtGUA0LHMdRAWBCE22yeodT1W8NB0RDawsYL8zEjZLXmBgoocxQtF1Rp9C8Lw+IQuwMsUUpOy0Vi0zw5sTCMIqMSAnNRzAKrqOyeNNAVQwlRVPzNPKHTb1i1E0MG0IgA */
    rpcRequestModel.createMachine({
      tsTypes: {} as import('./rpc-request.machine.typegen').Typegen0,
      schema: { services: {} as RpcRequestMachineServices },
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Sending Request',
          },
          on: {
            request: {
              target: 'Sending Request',
            },
          },
        },
        'Sending Request': {
          invoke: {
            src: 'Send request',
            onDone: [
              {
                target: 'Request succeeded',
              },
            ],
            onError: [
              {
                actions: 'Save error in context',
                cond: 'is network failed error',
                target: 'Sleeping',
              },
              {
                actions: 'Save error in context',
                target: 'Request failed',
              },
            ],
          },
        },
        'Request succeeded': {
          entry: 'Save response in context',
          always: {
            cond: 'is fire and forget',
            target: 'Request done',
          },
          on: {
            restartMachine: {
              actions: 'Remove response from context',
              target: 'Idle',
            },
          },
        },
        'Request failed': {
          type: 'final',
        },
        Sleeping: {
          after: {
            '5000': {
              target: 'Sending Request',
            },
          },
        },
        'Request done': {
          type: 'final',
        },
      },
      id: 'Rpc Request Machine',
    });

  return interpret(
    rpcRequestMachine.withConfig(
      {
        actions: {
          'Save response in context': assign({
            response: (_, event) => event.data,
            error: (_) => undefined,
          }),
          'Save error in context': assign({
            error: (_, event) => event.data,
            response: (_) => undefined,
          }),
          'Remove response from context': assign({
            response: (_) => undefined,
          }),
        },
        guards: {
          'is fire and forget': () => config?.fireAndForget ?? false,
          'auto start enabled': () => config?.eager ?? false,
          'is network failed error': (_, event) => {
            if (!(event.data instanceof Error)) {
              return false;
            }

            return event.data.message.includes('Network request failed');
          },
        },
        services: {
          'Send request': request,
        },
      },
      {
        response: undefined as T | undefined,
        error: undefined,
      }
    ),
    { devTools: true }
  );
};
