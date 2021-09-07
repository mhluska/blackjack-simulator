import { keys, SimpleObject } from '../types';

export type CliSettings = {
  help: boolean;
  h: boolean;
  raw: boolean;
};

export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function printUsageOptions<T extends SimpleObject>(
  defaultSettings: T,
  options: Partial<
    {
      [key in keyof T]: {
        hint?: string;
        formatter?: (value: T[key]) => string;
      };
    }
  > = {}
): void {
  keys(defaultSettings).forEach((key) => {
    const value = defaultSettings[key];
    if (typeof value === 'object' && !Array.isArray(value)) {
      printUsageOptions(value, options);
    } else {
      const items = [`  --${kebabCase(key.toString())}`];

      if (value !== null && typeof value !== 'undefined') {
        let formattedValue = options[key]?.formatter?.(value);
        if (formattedValue && formattedValue.includes('$')) {
          formattedValue = `'${formattedValue}'`;
        }

        items.push(formattedValue ?? value);
      }
      if (options[key]?.hint) {
        items.push(options[key]?.hint as string);
      }

      console.log(items.join(' '));
    }
  });
}
