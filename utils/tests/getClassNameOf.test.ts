import {getClassNameOf} from '../src/getClassNameOf';
import {describe, expect, it} from 'vitest';

enum TestEnum {
  string = 'string',
  numeric = 1,
}
class TestClass {}
class InheritedTestClass extends TestClass {}

describe('getClassNameOf', () => {
  it('works for Undefined', () => {
    expect(getClassNameOf(undefined)).toEqual('Undefined');
  });

  it('works for Object', () => {
    expect(getClassNameOf({})).toEqual('Object');
  });

  it('works for Number', () => {
    expect(getClassNameOf(123)).toEqual('Number');
  });

  it('works for String', () => {
    expect(getClassNameOf('tsinatra')).toEqual('String');
  });

  it('works for Function', () => {
    expect(getClassNameOf(() => {})).toEqual('Function');
  });

  it('works for Symbol', () => {
    expect(getClassNameOf(Symbol('success'))).toEqual('Symbol');
  });

  it('works for BigInt', () => {
    expect(getClassNameOf(BigInt('12345'))).toEqual('BigInt');
  });

  it('works for Null', () => {
    expect(getClassNameOf(null)).toEqual('Null');
  });

  it('works for Array', () => {
    expect(getClassNameOf([])).toEqual('Array');
  });

  it('works for Set', () => {
    expect(getClassNameOf(new Set())).toEqual('Set');
  });

  it('works for Map', () => {
    expect(getClassNameOf(new Map())).toEqual('Map');
  });

  it('works for RegExp', () => {
    expect(getClassNameOf(/a/)).toEqual('RegExp');
  });

  it('works for Date', () => {
    expect(getClassNameOf(new Date())).toEqual('Date');
  });

  it('Enum types return Object', () => {
    expect(getClassNameOf(TestEnum)).toEqual('Object');
  });

  it('Enum values return String or Number', () => {
    expect(getClassNameOf(TestEnum.string)).toEqual('String');
    expect(getClassNameOf(TestEnum.numeric)).toEqual('Number');
  });

  //   class TestClass {}
  it('Class type returns Function', () => {
    expect(getClassNameOf(TestClass)).toEqual('Function');
  });

  it('Class instance returns Class name', () => {
    expect(getClassNameOf(new TestClass())).toEqual('TestClass');
  });

  it('Class instance of SubClass returns the SubClass name', () => {
    expect(getClassNameOf(new InheritedTestClass())).toEqual(
      'InheritedTestClass'
    );
  });
});
