const listMonad = {
  // make :: a -> m a
  // make :: a -> [a]
  make: (...args) => args,
  // bind :: m a -> (a -> m b) -> m b
  // bind :: [a] -> (a -> [b]) -> [b]
  bind: someList => listReturningFunction =>
    [].concat(...someList.map(listReturningFunction)),
};

module.exports = {
  listMonad,
};
