/**
 * Implements basic semver checks. Only supports simple regex
 * like 1.0.0 does not support 1.0.0.alpha.0, etc
 */

// https://github.com/sindresorhus/semver-regex
function rx() {
  /* eslint-disable */
  return /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig;
  /* eslint-enable */
}

export function valid(v) {
  return typeof v === 'string' && rx().test(v);
}

export function clean(v) {
  if (valid(v)) {
    return rx().exec(v)[0];
  }
  throw new Error('invalid semver version');
}

function splitVersion(v) {
  const c = clean(v).split('.');
  const major = Number(c.shift());
  const minor = Number(c.shift());
  const patch = Number(c.shift());
  return { major, minor, patch };
}

export function eq(a, b) {
  return clean(a) === clean(b);
}

export function gt(a, b) {
  const sva = splitVersion(a);
  const svb = splitVersion(b);

  if (sva.major >= svb.major) {
    if (sva.major > svb.major) {
      return true;
    }
  } else {
    return false;
  }

  if (sva.minor >= svb.minor) {
    if (sva.minor > svb.minor) {
      return true;
    }
  } else {
    return false;
  }

  return sva.patch > svb.patch;
}

export function lt(a, b) {
  const sva = splitVersion(a);
  const svb = splitVersion(b);

  if (sva.major <= svb.major) {
    if (sva.major < svb.major) {
      return true;
    }
  } else {
    return false;
  }

  if (sva.minor <= svb.minor) {
    if (sva.minor < svb.minor) {
      return true;
    }
  } else {
    return false;
  }

  return sva.patch < svb.patch;
}

export function gte(a, b) {
  return eq(a, b) || gt(a, b);
}

export function lte(a, b) {
  return eq(a, b) || lt(a, b);
}
