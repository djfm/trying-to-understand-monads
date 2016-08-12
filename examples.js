const chai = require('chai');
if (!global.describe) {
  global.describe = () => null;
} else {
  chai.should();
}

const adaptNativeAPI = NativePromise => ({
  resolved: v => NativePromise.resolve(v),
  rejected: v => NativePromise.reject(v),
  deferred: () => {
    const d = {};
    const p = new Promise((resolve, reject) => {
      d.resolve = resolve;
      d.reject = reject;
    });
    d.promise = p;
    return d;
  },
});

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

const APlus = {
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

const add = x => y => x + y;
const sub = x => y => y - x;

for (const [desc, P] of
  [
    ['Native', adaptNativeAPI(Promise)],
    ['Candidate Implementation', APlus],
  ]) {
  describe(desc, () => {
    describe('A chain', () => {
      const p = P.resolved(0)
        .then(add(2))
        .then(add(3))
      ;

      it('can be continued', () =>
        p.then(sub(4)).then(
          x => x.should.equal(1)
        )
      );

      it('can be continued different ways', () =>
        p.then(sub(5)).then(
          x => x.should.equal(0)
        )
      );

      it('can be continued different ways', () =>
        p.then(add(1)).then(
          x => x.should.equal(6)
        )
      );

      describe('rejected values are handled by the right handler', () => {
        const f = P.rejected(1);

        it('the second handler is called', () =>
          f.then(undefined, x => x.should.equal(1))
        );

        it('turns failure into success', () =>
          f.then(undefined, sub(1)).then(x => x.should.equal(0))
        );

        it('unless the error handler rejects', () =>
          f.then(undefined, () => P.rejected(2)).then(undefined, x => x.should.equal(2))
        );
      });

      describe('handlers that are not functions are ignored', () => {
        it('a missing reject handler in the middle of the chain is ignored', done =>
          P.rejected('hey').then(() => null, undefined).then(undefined, () => done())
        );

        it('a missing resolve handler in the middle of the chained is ignored', done =>
          P.resolved('hey').then(undefined, () => null).then(() => done())
        );
      });
    });

    describe('Promises are async in a weird way', () => {
      it('the handlers are not called until the promise is resolved', done => {
        const d = P.deferred();
        let isFulfilled = false;

        d.promise.then(() => {
          isFulfilled.should.equal(true);
          done();
        });

        setTimeout(() => {
          d.resolve('hey');
          isFulfilled = true;
        }, 50);
      });

      it('the handlers at the end of a chain are called on resolve', () => {
        const d = P.deferred();

        setTimeout(() => d.resolve(0), 50);

        return d.promise.then(add(2)).then(sub(1)).then(
          x => x.should.equal(1)
        );
      });

      it('the reject handler at the end of a chain is called on reject', () => {
        const d = P.deferred();

        setTimeout(() => d.reject(0), 50);

        return d.promise.then(add(2)).then(sub(1)).then(
          undefined,
          x => x.should.equal(0)
        );
      });
    });
  });
}

module.exports = APlus;
