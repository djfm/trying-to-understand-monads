const listMonad = {
  // make :: a -> m a
  // make :: a -> [a]
  make: (...args) => args,

  // bind :: m a -> (a -> m b) -> m b
  // bind :: [a] -> (a -> [b]) -> [b]
  bind: someList => listReturningFunction =>
    [].concat(...someList.map(listReturningFunction)),
};

const maybeMonad = {
  // make :: a -> m a
  // make :: a -> Maybe a
  make: value => ({ just: value }),

  // bind :: m a -> (a -> m b) -> m b
  // bind :: Maybe a -> (a -> Maybe b) -> Maybe b
  bind: maybe => maybeReturningFunction => (
    'just' in maybe ?
      maybeReturningFunction(maybe.just) :
      { nothing: true }
  ),
};

module.exports = {
  listMonad,
  maybeMonad,
};
