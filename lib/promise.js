const forEachAsync = (item, ...nextItems) =>
  withItem => {
    if (item) {
      setImmediate(() => {
        withItem(item);
        forEachAsync(...nextItems)(withItem);
      });
    }
  };

const pResolve = value => ({
  state: 'pResolve',
  value,
});

const pReject = value => ({
  state: 'pReject',
  value,
});

const pChain = (...computations) => initialResult =>
  computations.reduce(
    ({ state, value }, computation) => {
      try {
        return (computation[state] || pResolve)(value);
      } catch (e) {
        return pReject(e);
      }
    },
    initialResult
  )
;

const deferred = () => {
  let state = 'pending';
  let next = [];
  let value;

  const settle = () => {
    if (state === 'pending') {
      return;
    }

    forEachAsync(...next)(
      computations => pChain(...computations)({ state, value })
    );

    next = [];
  };

  const resolve = v => {
    if (state !== 'pending') {
      return;
    }

    state = 'pResolve';
    value = v;

    settle();
  };

  const reject = v => {
    if (state !== 'pending') {
      return;
    }

    state = 'pReject';
    value = v;

    settle();
  };

  const addComputation = chain =>
    (onResolve, onReject) => {
      chain.push({
        pResolve: onResolve,
        pReject: onReject,
      });

      return {
        then: addComputation(chain),
      };
    };

  const promise = {
    then: (onResolve, onReject) => {
      const chain = [];
      setImmediate(() => {
        next.push(chain);
        settle();
      });
      return addComputation(chain)(onResolve, onReject);
    },
  };

  return {
    resolve,
    reject,
    promise,
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
