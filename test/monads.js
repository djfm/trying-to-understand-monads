const {
  inject,
} = require('../lib/glue');

const {
  listMonad,
} = require('../lib/monads');

describe('Using Monads', () => {
  describe('the list monad', () => {
    describe('is convenient to map a function over a list', () => {
      const mulBy2 = inject(listMonad)(x => x * 2);

      specify('[1, 2] x 2 => [2, 4]', () =>
        mulBy2([1, 2]).should.deep.equal([2, 4])
      );
    });

    describe('makes computing a cartesian product of several lists trivial', () => {
      const cartesianProduct = inject(listMonad)((a, b) => [a, b]);

      specify('[1, 2] x [3, 4] = [[1, 3], [1, 4], [2, 3], [2, 4]]', () =>
        cartesianProduct([1, 2], [3, 4]).should.deep.equal(
          [[1, 3], [1, 4], [2, 3], [2, 4]]
        )
      );
    });
  });
});
