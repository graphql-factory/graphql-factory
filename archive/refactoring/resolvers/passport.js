/**
 * Allows use of passport.js strategies
 * uses args as the body
 * 
 * Calling resolver(passport, strategy, modifier) returns
 * a new GraphQLFieldResolver
 */

function noop() {}
function identity(value) {
  return value;
}
const OPTS = { session: false, failWithError: true };

export default function resolver(passport, strategy, modifier) {
  const postProcess = typeof modifier === 'function' ?
    modifier :
    identity;

  return function passportResolve(source, args) {
    return new Promise((resolve, reject) => {
      try {
        const req = {
          logIn(user, options, done) {
            noop(options);
            req.username = user;
            return done();
          },
          body: args,
          username: null
        };

        const res = {
          statusCode: null,
          setHeader: noop,
          redirect: noop,
          end: value => {
            return value instanceof Error ? reject : resolve;
          }
        };

        // call authenticate on passport
        return passport.authenticate(strategy, OPTS)(req, res, err => {
          return err ? reject(err) : resolve(postProcess(req.username));
        });
      } catch (err) {
        return reject(err);
      }
    });
  };
}
