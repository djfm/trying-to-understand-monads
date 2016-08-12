const chai = require('chai');
if (!global.describe) {
  global.describe = () => null;
} else {
  chai.should();
}

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

const deferred = () => {
  let handlers = [];
  let state = 'pending';
  let value;

  const settle = () => {
    if (state === 'pending') {
      return;
    }

    for (const handler of handlers) {
      if (state === 'resolved') {
        handler.onResolve(value);
      } else if (state === 'rejected') {
        handler.onReject(value);
      }
    }

    handlers = [];
  };

  const resolve = resolvedValue => {
    if (state === 'pending') {
      state = 'resolved';
      value = resolvedValue;
      settle();
    }
  };

  const reject = rejectedValue => {
    if (state === 'pending') {
      state = 'rejected';
      value = rejectedValue;
      settle();
    }
  };

  const then = (onResolve, onReject) => {
    handlers.push({
      onResolve: defaultToId(onResolve),
      onReject: defaultToId(onReject),
    });
    settle();

    return {
      then,
    };
  };

  return {
    resolve,
    reject,
    promise: {
      then,
    },
  };
};

const add = x => y => x + y;
const sub = x => y => y - x;

for (const [desc, P] of
  [
    ['Native', Promise],
    ['Candidate Implementation', promise],
  ]) {
  describe(desc, () => {
    describe('A chain', () => {
      const p = P.resolve(0)
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
        const f = P.reject(1);

        it('the second handler is called', () =>
          f.then(undefined, x => x.should.equal(1))
        );

        it('turns failure into success', () =>
          f.then(undefined, sub(1)).then(x => x.should.equal(0))
        );

        it('unless the error handler rejects', () =>
          f.then(undefined, () => P.reject(2)).then(undefined, x => x.should.equal(2))
        );
      });

      describe('handlers that are not functions are ignored', () => {
        it('a missing reject handler in the middle of the chain is ignored', done =>
          P.reject('hey').then(() => null, undefined).then(undefined, () => done())
        );

        it('a missing resolve handler in the middle of the chained is ignored', done =>
          P.resolve('hey').then(undefined, () => null).then(() => done())
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
