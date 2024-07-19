import {Logger} from '@aws-lambda-powertools/logger';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import {beforeEach, describe, expect, it, SpyInstance, vi} from 'vitest';
import {
  BadRequestError,
  NotFoundError,
} from '../../../../errors/src/http/ClientSideError';
import {
  InternalServerError,
  ServiceUnavailableError,
} from '../../../../errors/src/http/ServerSideError';
import {ValidationError} from '../../../../errors/src/validation/ValidationError';
import {BaseHandler} from '../../../../handler/src/BaseHandler';
import {header, param} from '../../../../inject/src/annotation/ApiAnnotations';
import {singleton} from '../../../../inject/src/annotation/Singleton';
import {ApiBinding} from '../../../../inject/src/bindings/ApiBinding';
import {LambdaBinding} from '../../../../inject/src/bindings/LambdaBinding';
import {Constructor} from '../../../../models/src/Constructor';
import {EmptyRequest} from '../../../../requests/src/EmptyRequest';
import {TsinatraSerializer} from '../../../../serializer/src/TsinatraSerializer';
import {BaseApiLambda} from '../../../src/injectable/BaseApiLambda';

type Serializable = {serialize: () => object};

class TestHandler extends BaseHandler<EmptyRequest, string> {
  handle = async () => {
    return 'Hello world.';
  };
}

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

const clientSideError = new NotFoundError('The HelloWorld was not found');
class TestClientSideHttpErrorHandler extends BaseHandler<
  EmptyRequest,
  unknown
> {
  handle = async () => {
    throw clientSideError;
  };
}

const serverSideError = new ServiceUnavailableError();
class TestServerSideHttpErrorHandler extends BaseHandler<
  EmptyRequest,
  unknown
> {
  handle = async () => {
    throw serverSideError;
  };
}

const validationError = new ValidationError('Invalid input.');
class TestValidationErrorHandler extends BaseHandler<EmptyRequest, unknown> {
  handle = async () => {
    throw validationError;
  };
}

const genericError = new Error('Something happened.');
class TestGenericErrorHandler extends BaseHandler<EmptyRequest, unknown> {
  handle = async () => {
    throw genericError;
  };
}

class TestApiLambda extends BaseApiLambda<EmptyRequest, string | Serializable> {
  constructor(
    protected handler: Constructor<
      BaseHandler<EmptyRequest, string | Serializable>
    > = TestHandler
  ) {
    super();
  }
  request = EmptyRequest;
}

@singleton(ApiBinding.Request)
class TestRequest {
  constructor(
    @param()
    public message: string,
    @param()
    public name: string,
    @header('X-Api-Key')
    public xApiKey: string
  ) {}
}

class TestHandlerWithRequestClass extends BaseHandler<TestRequest, string> {
  handle = async (request: TestRequest) => {
    return `Hello ${request.name}, ${request.message}! Your API key is ${request.xApiKey}.`;
  };
}

class TestRequestLambda extends BaseApiLambda<TestRequest, string> {
  handler = TestHandlerWithRequestClass;
  request = TestRequest;
}

const event: APIGatewayProxyEventV2 = {
  requestContext: {
    http: {
      method: 'POST',
      path: '/lambda',
    },
  },
} as unknown as APIGatewayProxyEventV2;

const context: Context = {
  awsRequestId: '123',
} as unknown as Context;

describe('BaseApiLambda', () => {
  beforeEach(() => {
    vi.stubEnv('SERVICE_NAME', 'BaseApiLambda');
  });

  describe('#buildHandler', () => {
    let lambda: BaseApiLambda<EmptyRequest, string | Serializable>;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;

    beforeEach(() => {
      vi.stubEnv('TEST_ENV_VARIABLE', 'Testing');
      lambda = new TestApiLambda();
      handler = lambda.buildLambdaHandler();
    });

    it('build the handler correctly via injection', () => {
      expect(handler).toBeDefined();
    });

    it('binds environment variables to container', () => {
      expect(
        lambda.container.getNamed(LambdaBinding.Env, 'TEST_ENV_VARIABLE')
      ).toEqual('Testing');
    });

    it('handler executes correctly', async () => {
      const response = await handler.call(this, event, context);

      expect(response).toBeDefined();
      expect(response).toContain({
        body: '"Hello world."',
        statusCode: 200,
      });
      expect(response.headers).toContain({
        'Content-Type': 'application/json',
      });
    });

    it('logs via ResponseLoggerMiddleware', async () => {
      const logger = lambda.container.getNamed(
        Logger,
        'ResponseLoggerMiddleware'
      );
      const logSpy = vi.spyOn(logger, 'info');

      const response = await handler.call(this, event, context);

      expect(response).toBeDefined();
      expect(logSpy).toHaveBeenCalledWith('Request complete', {
        responseMetadata: {
          method: 'POST',
          path: '/lambda',
          requestDuration: expect.any(Number),
          requestId: '123',
          statusCode: 200,
        },
      });
    });
  });

  describe('with a handler that returns a serializable response', () => {
    let lambda: BaseApiLambda<EmptyRequest, string | Serializable>;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;

    beforeEach(() => {
      lambda = new TestApiLambda(TestSerializableSuccessfulHandler);
      handler = lambda.buildLambdaHandler();
    });

    it('returns a serialized 200 response', async () => {
      const response = await handler.call(this, event, context);

      expect(response).toBeDefined();
      expect(response).toContain({
        statusCode: 200,
        body: '{"message":"Hello world.","swapper":"Tsiny Natra"}',
      });
      expect(response.headers).toContain({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('with a handler that throws an HttpError', () => {
    let lambda: BaseApiLambda<EmptyRequest, string | Serializable>;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;

    let httpErrorLoggerSpy: SpyInstance;
    let response: APIGatewayProxyStructuredResultV2;

    describe('and it is a ClientSideError', () => {
      beforeEach(async () => {
        lambda = new TestApiLambda(TestClientSideHttpErrorHandler);
        handler = lambda.buildLambdaHandler();

        const logger = lambda.container.getNamed(
          Logger,
          'ErrorHandlerMiddleware'
        );
        httpErrorLoggerSpy = vi.spyOn(logger, 'error');

        response = await handler.call(this, event, context);
      });

      it('returns the expected error response', async () => {
        expect(response).toContain({
          statusCode: 404,
          body: JSON.stringify(TsinatraSerializer.serialize(clientSideError)),
        });
      });

      it('contains the right Content-Type', async () => {
        expect(response.headers).toContain({
          'Content-Type': 'application/json',
        });
      });

      it('calls the logger', async () => {
        expect(httpErrorLoggerSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('and it is a ServerSideError', () => {
      beforeEach(async () => {
        lambda = new TestApiLambda(TestServerSideHttpErrorHandler);
        handler = lambda.buildLambdaHandler();

        const logger = lambda.container.getNamed(
          Logger,
          'ErrorHandlerMiddleware'
        );
        httpErrorLoggerSpy = vi.spyOn(logger, 'error');

        response = await handler.call(this, event, context);
      });

      it('returns the expected error response', async () => {
        expect(response).toContain({
          statusCode: 503,
          body: JSON.stringify(TsinatraSerializer.serialize(serverSideError)),
        });
      });

      it('contains the right Content-Type', async () => {
        expect(response.headers).toContain({
          'Content-Type': 'application/json',
        });
      });

      it('call the logger', async () => {
        expect(httpErrorLoggerSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('with a handler that throws a  ValidationError', () => {
    let lambda: BaseApiLambda<EmptyRequest, string | Serializable>;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;

    let validationErrorLoggerSpy: SpyInstance;
    let response: APIGatewayProxyStructuredResultV2;

    beforeEach(async () => {
      lambda = new TestApiLambda(TestValidationErrorHandler);
      handler = lambda.buildLambdaHandler();

      const logger = lambda.container.getNamed(
        Logger,
        'ErrorHandlerMiddleware'
      );
      validationErrorLoggerSpy = vi.spyOn(logger, 'error');

      response = await handler.call(this, event, context);
    });

    it('returns a 400 error response', async () => {
      expect(response).toContain({
        statusCode: 400,
        body: JSON.stringify(
          TsinatraSerializer.serialize(
            new BadRequestError(validationError.message)
          )
        ),
      });
    });

    it('contains the right Content-Type', async () => {
      expect(response.headers).toContain({
        'Content-Type': 'application/json',
      });
    });

    it('call the logger', async () => {
      expect(validationErrorLoggerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a handler that throws a Generic Error', () => {
    let lambda: BaseApiLambda<EmptyRequest, string | Serializable>;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;

    let genericErrorLoggerSpy: SpyInstance;
    let response: APIGatewayProxyStructuredResultV2;

    beforeEach(async () => {
      lambda = new TestApiLambda(TestGenericErrorHandler);
      handler = lambda.buildLambdaHandler();

      const logger = lambda.container.getNamed(
        Logger,
        'ErrorHandlerMiddleware'
      );
      genericErrorLoggerSpy = vi.spyOn(logger, 'error');

      response = await handler.call(this, event, context);
    });

    it('returns a 500 error response', async () => {
      expect(response).toContain({
        statusCode: 500,
        body: JSON.stringify(
          TsinatraSerializer.serialize(
            new InternalServerError(genericError.message)
          )
        ),
      });
    });

    it('contains the right Content-Type', async () => {
      expect(response.headers).toContain({
        'Content-Type': 'application/json',
      });
    });

    it('logs the error', async () => {
      expect(genericErrorLoggerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a handler that has a request class', () => {
    let lambda: TestRequestLambda;
    let handler: (
      event: APIGatewayProxyEventV2,
      context: Context
    ) => Promise<APIGatewayProxyStructuredResultV2>;
    let response: APIGatewayProxyStructuredResultV2;

    beforeEach(async () => {
      lambda = new TestRequestLambda();
      handler = lambda.buildLambdaHandler();

      const eventWithParams = {
        ...event,
        pathParameters: {
          name: 'Tsiny',
        },
        queryStringParameters: {
          message: 'Tsinatra rocks',
        },
        headers: {
          'X-Api-Key': '123',
        },
      };

      response = await handler.call(this, eventWithParams, context);
    });

    it('returns a 200 response', async () => {
      expect(response).toContain({
        statusCode: 200,
      });
    });

    it('returns the correct response', async () => {
      expect(response.body).toEqual(
        '"Hello Tsiny, Tsinatra rocks! Your API key is 123."'
      );
    });
  });
});
