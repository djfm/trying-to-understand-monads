const {
  withMonad,
} = require('../lib/glue');

const {
  listMonad,
} = require('../lib/monads');

const mulBy2 = list => withMonad(listMonad)(
  ({ inject }) => inject(x => x * 2)(list)
);

describe('"mulBy2"', () => {
  specify('[1, 2] => [2, 4]', () =>
    mulBy2([1, 2]).should.deep.equal([2, 4])
  );
});


const cartesianProduct = (listA, listB) =>
  withMonad(listMonad)(
    ({ inject }) => inject(
      (a, b) => ({ a, b })
    )(listA, listB)
  )
;

describe('"cartesianProduct"', () => {
  specify('[1, 2] x [3, 4] = [[1, 3], [1, 4], [2, 3], [2, 4]]', () =>
    cartesianProduct([1, 2], [3, 4]).should.deep.equal(
      [{ a: 1, b: 3 }, { a: 1, b: 4 }, { a: 2, b: 3 }, { a: 2, b: 4 }]
    )
  );
});
