import { ECLReducer } from './ecl.reducers';
import { setPayments } from './ecl.actions';
import { initECLState } from './ecl.state';
import { Channel, PaymentRelayed } from '../../shared/models/eclModels';

const fromChannel = { channelId: 'chan-from', alias: 'alice', shortChannelId: '111x1x0' } as Channel;
const toChannel = { channelId: 'chan-to', alias: 'bob', shortChannelId: '222x1x0' } as Channel;

const relay = (type: string): PaymentRelayed => ({
  type, amountIn: 0, amountOut: 0,
  incoming: [{ channelId: 'chan-from', amount: 5000000 }],
  outgoing: [{ channelId: 'chan-to', amount: 4000000 }]
});

describe('ECLReducer', () => {
  it('keeps the type and fills amounts/aliases for parts-based relays in setPayments', () => {
    const state = { ...initECLState, activeChannels: [fromChannel, toChannel] };

    for (const type of ['on-the-fly-funding-payment-relayed', 'trampoline-payment-relayed']) {
      const result = ECLReducer(state, setPayments({ payload: { relayed: [relay(type)] } } as any));
      const stored = result.payments.relayed[0];

      expect(stored.type).toBe(type);
      expect(stored.amountIn).toBe(5000);
      expect(stored.amountOut).toBe(4000);
      expect(stored.fromChannelAlias).toBe('alice');
      expect(stored.toChannelAlias).toBe('bob');
      expect(stored.fromShortChannelId).toBe('111x1x0');
      expect(stored.toShortChannelId).toBe('222x1x0');
    }
  });
});
