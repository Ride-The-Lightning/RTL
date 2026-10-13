import { ECLReducer } from './ecl.reducers';
import { setPayments } from './ecl.actions';
import { initECLState } from './ecl.state';
import { Channel, PaymentRelayed } from '../../shared/models/eclModels';

const channel = { channelId: 'chan-1', alias: 'alice', shortChannelId: '123x1x0' } as Channel;
const relay = (type: string): PaymentRelayed => ({
  type, amountIn: 0, amountOut: 0,
  incoming: [{ channelId: 'chan-1', amount: 5000000 }],
  outgoing: [{ channelId: 'chan-1', amount: 4000000 }]
});

describe('ECLReducer', () => {
  it('keeps the type and fills amounts/aliases for parts-based relays in setPayments', () => {
    const state = { ...initECLState, activeChannels: [channel] };

    for (const type of ['on-the-fly-funding-payment-relayed', 'trampoline-payment-relayed']) {
      const result = ECLReducer(state, setPayments({ payload: { relayed: [relay(type)] } } as any));
      const stored = result.payments.relayed[0];

      expect(stored.type).toBe(type);
      expect(stored.amountIn).toBe(5000);
      expect(stored.amountOut).toBe(4000);
      expect(stored.fromChannelAlias).toBe('alice');
      expect(stored.toChannelAlias).toBe('alice');
    }
  });
});
