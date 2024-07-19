import {describe, expect, it} from 'vitest';
import {Enum} from '../Enum';

enum NativeCurrency {
  ETH = 'ETH',
  MATIC = 'MATIC',
  CELO = 'CELO',
  BNB = 'BNB',
}

enum ChainId {
  Mainnet = 1,
  Polygon = 137,
  Arbitrum = 42161,
}

describe('Enum', () => {
  describe('getValues', () => {
    describe('string-based enums', () => {
      it('contains the values of the NativeCurrency enum', () => {
        const NativeCurrencies = Enum.getValues(NativeCurrency);
        expect(NativeCurrencies).toEqual(['ETH', 'MATIC', 'CELO', 'BNB']);
      });
    });

    describe('numeric-based enums', () => {
      it('contains the values of the ChainId enum', () => {
        const ChainIds = Enum.getValues(ChainId);
        expect(ChainIds).toEqual([1, 137, 42161]);
      });
    });
  });
});
