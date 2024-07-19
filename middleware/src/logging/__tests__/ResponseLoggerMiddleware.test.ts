import {Logger} from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import {ResponseLoggerMiddleware} from '../ResponseLoggerMiddleware';
import {describe, it, expect, vi} from 'vitest';

// Extend the ResponseLoggerMiddleware to test against
// the protected requestStartTime property
class TestMiddleware extends ResponseLoggerMiddleware {
  public getRequestStartTime() {
    return this.requestStartTime;
  }

  public setRequestStartTime(requestStartTime: number) {
    this.requestStartTime = requestStartTime;
  }
}

describe('ResponseLoggerMiddleware', () => {
  it("Sets the requestStartTime on the instance in the 'before' hook", () => {
    const nowFn = () => 100;
    const logger = vi.fn() as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    // Ensure the requestStartTime is unset on a new instance
    expect(middleware.getRequestStartTime()).toBe(0);

    const {before} = middleware.createMiddleware();
    before!({} as middy.Request);

    // The requestStartTime should be set to the value returned by the nowFn
    expect(middleware.getRequestStartTime()).toBe(100);
  });

  it('Logs the requestId in the after hook', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        statusCode: 500,
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);
    expect(logPayload.responseMetadata.requestId).toBe('123');
  });

  it('Logs the http method in the after hook', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        statusCode: 500,
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);
    expect(logPayload.responseMetadata.method).toBe('GET');
  });

  it('Logs the path method in the after hook', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        statusCode: 500,
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);
    expect(logPayload.responseMetadata.path).toBe('/foo');
  });

  it('Calculates and logs the request duration based on the requestStartTime', () => {
    const startTime = 200;
    const endTime = 1000;
    const nowFn = () => endTime;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    middleware.setRequestStartTime(startTime);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        statusCode: 500,
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);

    const expectedDuration = endTime - startTime;
    expect(logPayload.responseMetadata.requestDuration).toBe(expectedDuration);
  });

  it('Logs the status code from the response if the response is defined as an object', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        statusCode: 500,
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);
    expect(logPayload.responseMetadata.statusCode).toBe(500);
  });

  it('Defaults the status code to a 200 if the response is a string', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: 'Ok!',
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);

    // Because the response is a string, the status code should be a 200
    expect(logPayload.responseMetadata.statusCode).toBe(200);
  });

  it('Defaults the status code to a 200 if the response is a valid object but the statusCode is not set', () => {
    const nowFn = () => 100;
    const mockLogInfo = vi.fn();
    const logger = {
      info: mockLogInfo,
    } as unknown as Logger;
    const middleware = new TestMiddleware(logger, nowFn);

    const {after} = middleware.createMiddleware();
    after!({
      context: {
        awsRequestId: '123',
      },
      event: {
        requestContext: {
          http: {
            method: 'GET',
            path: '/foo',
          },
        },
      },
      response: {
        body: 'Ok!',
      },
    } as middy.Request);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);

    // The first argument to the logger should be an object
    const logPayload = mockLogInfo.mock.calls[0][1];
    expect(logPayload).toBeInstanceOf(Object);

    // Because the response is an object without the statusCode field defined, the status code should be a 200
    expect(logPayload.responseMetadata.statusCode).toBe(200);
  });
});
