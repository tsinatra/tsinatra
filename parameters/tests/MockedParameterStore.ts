import {vi} from 'vitest';
import {IParameterStore} from '../src/IParameterStore';

export class MockedParameterStore extends IParameterStore {
  get = vi.fn();
  getBoolean = vi.fn();
  getNumber = vi.fn();
}
