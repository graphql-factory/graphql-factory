import { isObject, map } from '../jsutils';

export function castAppliedDirectiveList(directives) {
  return Array.isArray(directives)
    ? directives
    : isObject(directives)
      ? map(directives, (args, name) => {
          return { name, args };
        })
      : [];
}
