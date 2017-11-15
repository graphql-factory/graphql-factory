/**
 * @flow
 */
import assert from 'assert';

export function isObject(object: any): boolean {
    return typeof object === 'object' &&
    object !== null;
}

export function assertObject(
    object?: ?any,
    message: string,
    nonEmpty?: ?boolean
) {
    assert(
        object &&
        isObject(object) &&
        (!nonEmpty || (Boolean(nonEmpty) && Object.keys(object).length < 1)),
        message
    );
}
