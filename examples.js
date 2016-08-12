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

const defaultTo = replacementFn =>
  candidateFn => (
      typeof candidateFn === 'function' ?
        candidateFn :
        replacementFn
  )
;

const defaultToId = defaultTo(x => x);

const promise = {
  resolve: value => ({
    then: withValue =>
      Promise.resolve(defaultTo(promise.resolve)(withValue)(value)),
  }),
  reject: value => ({
    then: (unused, withValue) =>
      Promise.resolve(value).then(
        defaultTo(promise.reject)(withValue)
      ),
  }),
};

const doSettle = ({ state, value, handlers }) => {
  for (const handler of handlers) {
    if (state === 'resolved') {
      handler.onResolve(value);
    } else if (state === 'rejected') {
      handler.onReject(value);
    }
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

  const then = (onResolve, onReject) => {
    const nextDeferred = deferred();
    handlers.push({
      onResolve: v => nextDeferred.resolve(defaultToId(onResolve)(v)),
      onReject: v => nextDeferred.reject(defaultToId(onReject)(v)),
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
  resolved: promise.resolve,
  rejected: promise.reject,
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
    });
  });
}

module.exports = {
  resolved: promise.resolve,
  rejected: promise.reject,
  deferred,
};
