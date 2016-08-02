const {
  doWithin,
  inject,
  chain,
} = require('../lib/glue');

const { maybeMonad } = require('../lib/monads');

describe('The Monadic Glue', () => {
  specify('"doWithin" doesn\'t promote values automatically', () =>
    doWithin(maybeMonad)(
      x => x
    )(maybeMonad.make(2)).should.equal(2)
  );

  specify('"inject" promotes values automatically', () =>
    inject(maybeMonad)(
      x => x
    )(maybeMonad.make(2)).should.deep.equal({ just: 2 })
  );

  specify('sure I can nest calls to "bind"...', () =>
    maybeMonad.bind(
      maybeMonad.bind(maybeMonad.make(2))(
        x => maybeMonad.make(2 * x)
      )
    )(x => maybeMonad.make(x - 4)).should.deep.equal({ just: 0 })
  );

  specify('...but "chain" is way more convenient!', () =>
    chain(maybeMonad)(
      x => maybeMonad.make(2 * x),
      x => maybeMonad.make(x - 4)
    )(maybeMonad.make(2)).should.deep.equal({ just: 0 })
  );

  specify('...especially when there are many monadic operations to perform!', () =>
    chain(maybeMonad)(
      x => maybeMonad.make(2 * x),
      x => maybeMonad.make(x - 4),
      x => maybeMonad.make(x + 1),
      x => maybeMonad.make(x - 2)
    )(maybeMonad.make(2)).should.deep.equal({ just: -1 })
  );
});
