import { keys, SimpleObject } from '../types';

export type CliSettings = {
  help: boolean;
  h: boolean;
  raw: boolean;
};

export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function isPlainObject(object: unknown): object is Record<string, unknown> {
  return (
    typeof object === 'object' && object !== null && !Array.isArray(object)
  );
}

export function printUsageOptions<T extends SimpleObject>(
  defaultSettings: T,
  options: Partial<{
    [key in keyof T]: {
      hint?: string;
      formatter?: (value: T[key]) => string;
    };
  }> = {},
): void {
  keys(defaultSettings).forEach((key) => {
    const value = defaultSettings[key];
    if (isPlainObject(value)) {
      printUsageOptions(value);
      return;
    }

    const items = [`  --${kebabCase(key.toString())}`];

    if (value !== null && typeof value !== 'undefined') {
      let formattedValue = options[key]?.formatter?.(value);
      if (
        formattedValue !== undefined &&
        formattedValue !== '' &&
        formattedValue.includes('$')
      ) {
        formattedValue = `'${formattedValue}'`;
      }

      items.push(formattedValue ?? String(value));
    }

    const hint = options[key]?.hint;
    if (hint !== undefined && hint !== '') {
      items.push(hint);
    }

    console.log(items.join(' '));
  });
}
