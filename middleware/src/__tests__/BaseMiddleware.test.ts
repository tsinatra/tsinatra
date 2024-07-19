import middy from '@middy/core';
import {BaseMiddleware} from '../BaseMiddleware';
import {Context} from 'aws-lambda';
import {describe, it, expect, vi, Mock} from 'vitest';

describe('BaseMiddlewareFactory', () => {
  it("should ensure the bound hooks can access the underlying middleware instance's attributes", () => {
    // We want to ensure that the hooks that are returned from `createMiddleware` can still
    // access attributes on the underlying middleware instance. This allows us to inject dependencies
    // into the constructor and use them in the hook functions.
    class TestMiddleware extends BaseMiddleware {
      constructor(
        private beforeMock: Mock,
        private afterMock: Mock,
        private onErrorMock: Mock
      ) {
        super();
      }

      protected before = () => {
        this.beforeMock();
      };

      protected after = () => {
        this.afterMock();
      };

      protected onError = () => {
        this.onErrorMock();
      };
    }

    const beforeMock = vi.fn();
    const afterMock = vi.fn();
    const onErrorMock = vi.fn();

    const middlewareFactory = new TestMiddleware(
      beforeMock,
      afterMock,
      onErrorMock
    );

    const {before, after, onError} = middlewareFactory.createMiddleware();
    expect(beforeMock).toHaveBeenCalledTimes(0);
    // See note above why we can safely call these hooks
    before!(dummyRequest);
    expect(beforeMock).toHaveBeenCalledTimes(1);

    expect(afterMock).toHaveBeenCalledTimes(0);
    after!(dummyRequest);
    expect(afterMock).toHaveBeenCalledTimes(1);

    expect(onErrorMock).toHaveBeenCalledTimes(0);
    onError!(dummyRequest);
    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });

  // `createMiddleware` returns an instance of a middy.MiddlewareObj that defines
  // the 'before', 'after', and 'onError' hooks as optional.
  // BaseMiddleware's will always define these methods, so we can safely
  // assert that the hooks exist. For posterity, first assert that these
  // hooks exist before attempting to call them.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dummyRequest = {} as middy.Request<any, any, Error, Context>;

  it('should allow "before" hook to be called without crashing', () => {
    const {before} = new BaseMiddleware().createMiddleware();
    expect(before).toBeDefined();
    expect(() => before!(dummyRequest)).not.toThrow();
  });

  it('should allow "after" to be called without crashing', () => {
    const {after} = new BaseMiddleware().createMiddleware();
    expect(after).toBeDefined();
    expect(() => after!(dummyRequest)).not.toThrow();
  });

  it('should allow "onError" to be called without crashing', () => {
    const {onError} = new BaseMiddleware().createMiddleware();
    expect(onError).toBeDefined();
    expect(() => onError!(dummyRequest)).not.toThrow();
  });
});
