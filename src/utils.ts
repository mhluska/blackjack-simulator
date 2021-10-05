import { SimpleObject, Suit, Rank, enumValues, entries } from './types';

type Range<T> = { start: number; end: number; value: T };

export default class Utils {
  // TODO: Move to stats utils.
  static arraySum(data: number[]): number {
    return data.reduce((acc, current) => acc + current, 0);
  }

  // TODO: Move to stats utils.
  static arrayMean(data: number[]): number {
    return this.arraySum(data) / data.length;
  }

  // TODO: Move to stats utils.
  static arrayVariance(data: number[]): number {
    const dataMean = this.arrayMean(data);
    return (
      this.arraySum(data.map((num) => (num - dataMean) ** 2)) /
      (data.length - 1)
    );
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

  static arrayflatten<R>(array: R[][]): R[] {
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

  // See https://stackoverflow.com/a/52584017/659910
  static titleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, (match) => ` ${match}`)
      .replace(/^./, (match) => match.toUpperCase())
      .trim();
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

  static compareRange(number: number, range: [string, number]): boolean {
    return range[0][0] === '>' ? number >= range[1] : number <= range[1];
  }

  // See https://stackoverflow.com/a/40724354/659910
  static abbreviateNumber(number: number): string {
    const SI_SYMBOL = ['', 'K', 'M', 'B', 'T'];

    // Determine symbol.
    const tier = (Math.log10(Math.abs(number)) / 3) | 0;

    if (tier === 0) {
      return number.toString();
    }

    const suffix = SI_SYMBOL[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    const fixed = scaled.toFixed(1);

    return (fixed.includes('.0') ? scaled.toFixed(0) : fixed) + suffix;
  }

  static formatCents(
    cents: number,
    {
      stripZeroCents = false,
      stripCommas = false,
    }: { stripZeroCents?: boolean; stripCommas?: boolean } = {}
  ): string {
    let value = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

    if (stripCommas) {
      value = value.replace(/,/g, '');
    }

    if (stripZeroCents && value.endsWith('.00')) {
      return value.slice(0, value.length - 3);
    } else {
      return value;
    }
  }

  static formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  static formatTime(timeMs: number): string {
    return `${(timeMs / 1000).toFixed(2)} seconds`;
  }

  static merge<T extends SimpleObject>(target: T, ...sources: Partial<T>[]): T {
    return Object.assign(target, ...sources);
  }

  static copy<T extends SimpleObject>(object: T): T {
    return Object.assign({}, object);
  }

  static arrayToRanges<T>(array: T[]): Range<T>[] {
    const ranges: Range<T>[] = [];

    let rangeStart = 0;
    let rangeEnd = 0;
    let prevItem = array[0];

    const pushRange = () => {
      ranges.push({
        start: rangeStart,
        end: rangeEnd - 1,
        value: prevItem,
      });
    };

    for (const item of array) {
      if (item !== prevItem) {
        pushRange();
        rangeStart = rangeEnd;
        prevItem = item;
      }

      rangeEnd += 1;
    }

    pushRange();

    return ranges;
  }

  static rangeToString<T>(
    range: Range<T>,
    isOnly: boolean,
    isLast: boolean
  ): string {
    if (isOnly) {
      return `${range.start}+`;
    }

    const rangeString =
      range.start === range.end
        ? range.start.toString()
        : `${range.start}–${range.end}`;

    return `${rangeString}${isLast ? '+' : ''}`;
  }

  static arrayToRangeString<T>(
    array: T[],
    formatter = (value: T): string => String(value)
  ): string {
    const ranges = Utils.arrayToRanges(array);

    return Utils.arrayToRanges(array)
      .map(
        (range, index) =>
          `TC ${Utils.rangeToString(
            range,
            ranges.length === 1,
            index === ranges.length - 1
          )}: ${formatter(range.value)}`
      )
      .join(', ');
  }

  static compact<T extends SimpleObject>(
    object: T
  ): { [P in keyof T]: NonNullable<T[P]> } {
    Object.keys(object).forEach((key) => {
      if (object[key] === null || typeof object[key] === 'undefined') {
        delete object[key];
      }
    });

    return object;
  }

  static mapValues<InputObject extends SimpleObject, MapReturnType>(
    obj: InputObject,
    map: (key: keyof InputObject) => MapReturnType
  ): { [P in keyof InputObject]: MapReturnType } {
    const result = {} as {
      [P in keyof InputObject]: MapReturnType;
    };

    entries(obj).forEach(([key, value]) => {
      result[key] = map(value);
    });

    return result;
  }

  static randomSuit(): Suit {
    return Utils.arraySample(enumValues(Suit));
  }

  static randomRank(): Rank {
    return Utils.arraySample(enumValues(Rank));
  }
}
