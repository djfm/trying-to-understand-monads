const {
  curry,
} = require('./functional');

// doWithin :: monad -> ((a, ..., a) -> m b) -> (m a, ..., m a) -> m b
const doWithin = monad =>
  monadicFunction =>
    (monadicValue, ...nextMonadicValues) =>
      monad.bind(monadicValue)(normalValue => (
        nextMonadicValues.length > 0 ?
          doWithin(monad)(
            curry(monadicFunction, nextMonadicValues.length + 1)(normalValue)
          )(...nextMonadicValues) :
          monadicFunction(normalValue)
      ))
;

// chain :: monad -> (a -> m b, b -> m c, ..., x -> m y) -> m a -> m y
const chain = monad =>
  (monadicFunction, ...nextMonadicFunctions) =>
    monadicValue =>
      monad.bind(monadicValue)(
        nextMonadicFunctions.length > 0 ?
          normalValue => chain(monad)(...nextMonadicFunctions)(
            monadicFunction(normalValue)
          ) :
        monadicFunction
      )
;

// inject :: monad -> ((...a) -> b) -> (...m a) -> m b
const inject = monad => funcOfRegularValues =>
  doWithin(monad)((...values) => monad.make(funcOfRegularValues(...values)))
;

module.exports = {
  inject,
  doWithin,
  chain,
};
