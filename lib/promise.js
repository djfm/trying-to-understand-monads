const firstFn = (maybeFn, ...otherCandidates) => (
  typeof maybeFn === 'function' ?
    maybeFn :
    firstFn(...otherCandidates)
);

const forEachAsync = (item, ...nextItems) =>
  withItem => {
    if (item) {
      setImmediate(() => {
        withItem(item);
        forEachAsync(...nextItems)(withItem);
      });
    }
  };

const deferred = () => {
  let state = 'pending';
  let nextDeferred = [];
  let value;

  const settle = () => {
    if (state === 'pending') {
      return;
    }

    forEachAsync(...nextDeferred)(
      d => {
        if (state === 'resolved') {
          d.resolve(value);
        } else if (state === 'rejected') {
          d.reject(value);
        }
      }
    );

    nextDeferred = [];
  };

  const resolve = resolvedValue => {
    if (state === 'pending') {
      value = resolvedValue;
      state = 'resolved';
      settle();
    }
  };

  const reject = rejectedValue => {
    if (state === 'pending') {
      value = rejectedValue;
      state = 'rejected';
      settle();
    }
  };

  const promise = {
    then: (withResolvedValue, withRejectedValue) => {
      const d = deferred();

      const guardAgainstDirectRecursion = v => {
        if (v === d.promise) {
          throw new TypeError('A promise cannot be chained to itself.');
        }
        return v;
      };

      setImmediate(() => {
        nextDeferred.push({
          promise: d.promise,
          resolve: v => {
            try {
              const thenable = guardAgainstDirectRecursion(
                firstFn(
                  withResolvedValue,
                  withRejectedValue,
                  x => x
                )(v)
              );

              if (thenable instanceof Object && 'then' in thenable) {
                thenable.then(d.resolve, d.reject);
              } else {
                d.resolve(thenable);
              }
            } catch (e) {
              d.reject(e);
            }
          },
          reject: v => {
            try {
              const thenable = guardAgainstDirectRecursion(
                firstFn(
                  withRejectedValue,
                  withResolvedValue,
                  x => x
                )(v)
              );

              if (thenable instanceof Object && 'then' in thenable) {
                thenable.then(d.resolve, d.reject);
              } else {
                d.reject(thenable);
              }
            } catch (e) {
              d.reject(e);
            }
          },
        });

        settle();
      });

      return d.promise;
    },
  };

  return {
    promise,
    resolve,
    reject,
  };
};

const resolved = value => {
  const d = deferred();
  d.resolve(value);
  return d.promise;
};

const rejected = value => {
  const d = deferred();
  d.reject(value);
  return d.promise;
};

module.exports = {
  resolved,
  rejected,
  deferred,
};
