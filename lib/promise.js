const ifThenable = value =>
  (...argsForThen) =>
    withValue => {
      if (value) {
        const then = value.then;
        if (then) {
          return then.call(value, ...argsForThen);
        }
      }
      return withValue(value);
    };

const continueComputation = ({ state, value, handler }) => {
  const transform = handler.transformInput[state];
  if (typeof transform === 'function') {
    try {
      const newValue = transform(value);
      if (newValue === handler.promise) {
        throw new TypeError('A promise cannot be chained to itself.');
      }
      handler.propagateOutput.resolved(newValue);
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

const once = () => {
  let called = false;
  return {
    once: fn => (...args) => {
      if (!called) {
        called = true;
        fn(...args);
      }
    },
  };
};

const deferred = () => {
  let handlers = [];
  let state = 'pending';
  let value;

  const settle = () => {
    if (state !== 'resolved' && state !== 'rejected') {
      return;
    }

    doSettle({
      state,
      value,
      handlers,
    });

    handlers = [];
  };

  const setState = targetState =>
    futureValue => {
      ifThenable(futureValue)(
        setState('resolved'),
        setState('rejected')
      )(() => {
        state = targetState;
        value = futureValue;
        setImmediate(settle);
      });
    }
  ;

  const just = once();

  const resolve = just.once(
    resolvedValue => {
      try {
        ifThenable(resolvedValue)(
          setState('resolved'),
          setState('rejected')
        )(setState('resolved'));
      } catch (e) {
        setState('rejected')(e);
      }
    }
  );

  const reject = just.once(setState('rejected'));

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
        promise: nextDeferred.promise,
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
