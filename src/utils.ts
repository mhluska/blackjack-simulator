import Card from './card';
import { SimpleObject } from './types';

export default class Utils {
  static arraySum(array: number[]): number {
    return array.reduce((acc, current) => acc + current, 0);
  }

  // Fisher–Yates shuffle algorithm.
  // See https://stackoverflow.com/a/6274381/659910
  static arrayShuffle<R>(array: R[]): R[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  static arraySample<R>(array: R[]): R {
    return array[this.random(0, array.length - 1)];
  }

  static arrayMove<R>(array: R[], fromIndex: number, toIndex: number): void {
    const element = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, element);
  }

  static arrayFlatten<R>(array: R[][]): R[] {
    return array.reduce((flatten: R[], arr: R[]) => [...flatten, ...arr]);
  }

  static random(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomId(): string {
    // TODO: Make the backend generate this.
    // return crypto.randomBytes(16).toString('hex');
    return Math.random().toString(36).substring(2);
  }

  static clamp(number: number, min: number, max: number): number {
    return Math.max(Math.min(number, max), min);
  }

  // See https://stackoverflow.com/a/43532829
  static round(value: number, digits = 2): number {
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);

    return value;
  }

  // Range will be either `>= x` or `< x` for an integer `x`.
  static rangeBoundary(range: string): number {
    const number = range.split(' ').pop();
    return number ? parseInt(number) : 0;
  }

  static compareRange(number: number, range: string): boolean {
    const boundary = this.rangeBoundary(range);
    return range.includes('>=') ? number >= boundary : number < boundary;
  }

  static hiLoValue(cards: Card[]): number {
    return cards.reduce((acc, card) => acc + card.hiLoValue, 0);
  }

  static formatCents(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  }

  // See https://stackoverflow.com/a/34749873/659910
  static mergeDeep<T extends SimpleObject>(target: T, ...sources: T[]): T {
    const isObject = (item: T | undefined) =>
      item && typeof item === 'object' && !Array.isArray(item);

    const source = sources.shift();
    if (!source) {
      return target;
    }

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeDeep(target, ...sources);
  }
}
