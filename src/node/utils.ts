import { keys, SimpleObject } from '../types';

export type CliSettings = {
  help: boolean;
};

export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function printUsageOptions<T extends SimpleObject>(
  defaultSettings: T,
  valueOverrides: Partial<{ [key in keyof T]: string | string[] }> = {}
): void {
  keys(defaultSettings).forEach((key) => {
    const value = defaultSettings[key];
    if (typeof value === 'object' && !Array.isArray(value)) {
      printUsageOptions(value, valueOverrides);
    } else {
      const items = [`  --${kebabCase(key.toString())}`];

      if (value) {
        items.push(value);
      }
      if (valueOverrides[key]) {
        items.push(valueOverrides[key] as string);
      }

      console.log(items.join(' '));
    }
  });
}
