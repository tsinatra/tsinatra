import {describe, expect, it} from 'vitest';
import {EmptyRequest} from '../../../requests';
import {BaseHandler} from '../BaseHandler';

class TestSuccessfulHandler extends BaseHandler<EmptyRequest, string> {
  handle = async () => {
    return 'Hello world.';
  };
}

type Serializable = {serialize: () => object};

class TestSerializableSuccessfulHandler extends BaseHandler<
  EmptyRequest,
  Serializable
> {
  handle = async () => {
    return {
      serialize: () => ({
        message: 'Hello world.',
        swapper: 'Tsiny Natra',
      }),
    };
  };
}

describe('BaseHandler', () => {
  describe('successful response', () => {
    it('returns a string response', async () => {
      const testHandler = new TestSuccessfulHandler();
      const response = await testHandler.handle();

      expect(response).toEqual('Hello world.');
    });

    it('returns an object response', async () => {
      const testHandler = new TestSerializableSuccessfulHandler();
      const response = await testHandler.handle();

      expect(response.serialize).toBeDefined();
      expect(response.serialize()).toContain({
        message: 'Hello world.',
        swapper: 'Tsiny Natra',
      });
    });
  });
});
