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

      setImmediate(() => {
        nextDeferred.push({
          promise: d.promise,
          resolve: v => {
            try {
              d.resolve(firstFn(
                withResolvedValue,
                withRejectedValue,
                x => x
              )(v));
            } catch (e) {
              d.reject(e);
            }
          },
          reject: v => {
            try {
              d.reject(firstFn(
                withRejectedValue,
                withResolvedValue,
                x => x
              )(v));
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
