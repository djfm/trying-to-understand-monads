const continueComputation = ({ state, value, handler }) => {
  const transform = handler.transformInput[state];
  if (typeof transform === 'function') {
    try {
      handler.propagateOutput.resolved(transform(value));
    } catch (e) {
      handler.propagateOutput.rejected(e);
    }
  } else {
    handler.propagateOutput[state](value);
  }
};

const doSettle = ({ state, value, handlers }) => {
  for (const handler of handlers) {
    continueComputation({ state, value, handler });
  }
};

const deferred = () => {
  let handlers = [];
  let state = 'pending';
  let value;

  const settle = () => {
    if (state === 'pending') {
      return;
    }

    doSettle({
      state,
      value,
      handlers,
    });

    handlers = [];
  };

  const resolve = resolvedValue => {
    if (state === 'pending') {
      state = 'resolved';
      value = resolvedValue;
      setImmediate(settle);
    }
  };

  const reject = rejectedValue => {
    if (state === 'pending') {
      state = 'rejected';
      value = rejectedValue;
      setImmediate(settle);
    }
  };

  const then = (onResolved, onRejected) => {
    const nextDeferred = deferred();

    setImmediate(() => {
      handlers.push({
        transformInput: {
          resolved: onResolved,
          rejected: onRejected,
        },
        propagateOutput: {
          resolved: nextDeferred.resolve,
          rejected: nextDeferred.reject,
        },
      });
      settle();
    });

    return nextDeferred.promise;
  };

  return {
    resolve,
    reject,
    promise: {
      then,
    },
  };
};

module.exports = {
  resolved: value => {
    const d = deferred();
    d.resolve(value);
    return d.promise;
  },
  rejected: value => {
    const d = deferred();
    d.reject(value);
    return d.promise;
  },
  deferred,
};
