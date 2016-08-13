const promise = require('../lib/promise');

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

const add = x => y => x + y;
const sub = x => y => y - x;

for (const [desc, P] of
  [
    ['Native', adaptNativeAPI(Promise)],
    ['Candidate Implementation', promise],
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

  describe('When a thenable returns a promise, its state is assumed', () => {
    it('the state of a resolved promise is assumed', () => {
      const y = {
        then: onFulfilled => onFulfilled('hey'),
      };
      return P
        .resolved('dummy')
        .then(() => P.resolved(y))
        .then(
          x => x.should.equal('hey')
        );
    });

    it('the state of a deep resolved promise is assumed', () => {
      const y = {
        then: onFulfilled => onFulfilled(
          P.resolved('hey')
        ),
      };
      return P
        .resolved('dummy')
        .then(() => P.resolved(y))
        .then(
          x => x.should.equal('hey')
        );
    });

    it('the state of deep a misbehaving resolved promise is assumed', done => {
      const y = {
        then: onFulfilled => onFulfilled({
          then: handler => {
            handler('hey');
            handler('hoo');
          },
        }),
      };
      return P
        .resolved('dummy')
        .then(() => P.resolved(y))
        .then(x => {
          try {
            x.should.equal('hey');
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('the state of a thenable that throws after resolve is assumed', () => {
      const y = {
        then: onFulfilled => {
          onFulfilled('hey');
          throw new Error('woops');
        },
      };
      return P
        .resolved('dummy')
        .then(() => y)
        .then(
          x => x.should.equal('hey')
        );
    });

    it('the state of a thenable that throws after resolving asynchronously is assumed', () => {
      const y = {
        then: onFulfilled => {
          onFulfilled('hey');
          throw new Error('woops');
        },
      };

      const x = {
        then: onFulfilled => {
          setTimeout(() => onFulfilled(y), 0);
        },
      };

      return P
        .resolved('dummy')
        .then(() => x)
        .then(
          v => v.should.equal('hey')
        );
    });
  });
}
