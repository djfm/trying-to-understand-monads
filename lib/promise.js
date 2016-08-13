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

const once = maybeFn => {
  if (typeof maybeFn === 'function') {
    return once().once(maybeFn);
  }
  let called = false;
  return {
    once: fn => (...args) => {
      if (!called) {
        called = true;
        fn(...args);
      }
    },
    wasCalled: () => called,
  };
};

const swallowException = fn =>
  (...args) => {
    try {
      return fn(...args);
    } catch (e) {
      return void[e];
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

  const setState = targetState =>
    swallowException(
      futureValue =>
        ifThenable(futureValue)(
          once(setState('resolved')),
          once(setState('rejected'))
        )(() => {
          state = targetState;
          value = futureValue;
          setImmediate(settle);
        })
    )
  ;

  const just = once();

  const resolve = just.once(
    resolvedValue => {
      const spy = once();
      try {
        ifThenable(resolvedValue)(
          spy.once(setState('resolved')),
          once(setState('rejected'))
        )(setState('resolved'));
      } catch (e) {
        if (!spy.wasCalled()) {
          setState('rejected')(e);
        }
      }
    }
  );

  const reject = just.once(
    rejectedValue => {
      state = 'rejected';
      value = rejectedValue;
      setImmediate(settle);
    }
  );

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
