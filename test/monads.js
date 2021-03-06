const {
  inject,
} = require('../lib/glue');

const {
  listMonad,
  maybeMonad,
  promiseMonad,
} = require('../lib/monads');

describe('Using Monads', () => {
  describe('the maybe monad', () => {
    specify('{ just: 1 } x 2 => { just: 2 }', () =>
      inject(maybeMonad)(x => x * 2)({ just: 1 }).should.deep.equal({ just: 2 })
    );

    specify('{ just: 1 } x { nothing: true } => { nothing: true }', () =>
      inject(maybeMonad)((a, b) => a * b)(
        { just: 1 },
        { nothing: true }
      ).should.deep.equal({ nothing: true })
    );
  });

  describe('the list monad', () => {
    describe('is convenient to map a function over a list', () => {
      const mulBy2 = inject(listMonad)(x => x * 2);

      specify('[1, 2] x 2 => [2, 4]', () =>
        mulBy2([1, 2]).should.deep.equal([2, 4])
      );

      specify('([1, 2], [3, 4]) x 2 => [2, 2, 4, 4]', () =>
        mulBy2([1, 2], [3, 4]).should.deep.equal([2, 2, 4, 4])
      );
    });

    describe('makes computing a cartesian product of several lists trivial', () => {
      const cartesianProduct = inject(listMonad)((...args) => [].concat(...args));

      specify('[1, 2] x [3, 4] = [[1, 3], [1, 4], [2, 3], [2, 4]]', () =>
        cartesianProduct([1, 2], [3, 4]).should.deep.equal(
          [[1, 3], [1, 4], [2, 3], [2, 4]]
        )
      );

      specify('the cartesian product is left- and right- associative', () => {
        cartesianProduct([1, 2], [3, 4], [5, 6]).should.deep.equal(
          cartesianProduct([1, 2], cartesianProduct([3, 4], [5, 6]))
        );

        cartesianProduct([1, 2], [3, 4], [5, 6]).should.deep.equal(
          cartesianProduct(cartesianProduct([1, 2], [3, 4]), [5, 6])
        );
      });
    });
  });

  describe('the promise monad', () => {
    it('chains operations together', () =>
      inject(promiseMonad)(x => x * 2)(
        promiseMonad.make(4)
      ).then(normalValue => {
        normalValue.should.equal(8);
      })
    );

    const sum2 = (x, y) => x + y;
    const sub2 = (x, y) => x - y;

    it('chains multiple operations together', () =>
      inject(promiseMonad)(sum2)(
        inject(promiseMonad)(sub2)(
          promiseMonad.make(8),
          promiseMonad.make(4)
        ),
        promiseMonad.make(4)
      ).then(normalValue => {
        normalValue.should.equal(8);
      })
    );

    it('propagates failure', () =>
      inject(promiseMonad)(sum2)(
        inject(promiseMonad)(sub2)(
          Promise.reject(new Error('Nope!')),
          promiseMonad.make(4)
        ),
        promiseMonad.make(4)
      )
      .then(() => {
        throw new Error('The computation should not have succeeded.');
      })
      .catch(error => {
        error.message.should.equal('Nope!');
      })
    );
  });
});
