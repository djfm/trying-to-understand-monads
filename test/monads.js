const {
  withMonad,
} = require('../lib/glue');

const {
  listMonad,
} = require('../lib/monads');

describe('Using Monads', () => {
  describe('the list monad', () => {
    describe('is convenient to map a function over a list', () => {
      const mulBy2 = list => withMonad(listMonad)(
        ({ inject }) => inject(x => x * 2)(list)
      );

      specify('[1, 2] x 2 => [2, 4]', () =>
        mulBy2([1, 2]).should.deep.equal([2, 4])
      );
    });

    describe('makes computing a cartesian product of several lists trivial', () => {
      const cartesianProduct = (listA, listB) =>
        withMonad(listMonad)(
          ({ inject }) => inject(
            (a, b) => [a, b]
          )(listA, listB)
        )
      ;

      specify('[1, 2] x [3, 4] = [[1, 3], [1, 4], [2, 3], [2, 4]]', () =>
        cartesianProduct([1, 2], [3, 4]).should.deep.equal(
          [[1, 3], [1, 4], [2, 3], [2, 4]]
        )
      );
    });
  });
});
