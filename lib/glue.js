// doWithin :: monad -> ((a, b, ..., y) -> m z) -> (m a, m b, ..., m y) -> m z
const doWithin = monad =>
  monadicFunction =>
    (...monadicValues) =>
      monadicValues.reduceRight(
        (mFunction, monadicValue) =>
          (...collectedValues) => monad.bind(monadicValue)(
            normalValue => mFunction(...collectedValues, normalValue)
          ),
        monadicFunction
      )()
;

// chain :: monad -> (a -> m b, b -> m c, ..., x -> m y) -> m a -> m y
const chain = monad =>
  (...monadicFunctions) =>
    initialMonadicValue =>
      monadicFunctions.reduce(
        (monadicValue, monadicFunction) =>
          monad.bind(monadicValue)(monadicFunction),
        initialMonadicValue
      )
;

// inject :: monad -> ((...a) -> b) -> (...m a) -> m b
const inject = monad => funcOfRegularValues =>
  doWithin(monad)((...values) => monad.make(funcOfRegularValues(...values)))
;

// chainFluent :: methodName -> (a, b, ..., z) -> X
// where X = a[methodName](b) ... [methodName](z)
const chainFluent = methodName =>
  (firstInstance, ...nextInstances) =>
    chain({
      bind: instance => otherInstance =>
        instance[methodName](otherInstance),
    })(...nextInstances)(firstInstance)
;

module.exports = {
  inject,
  doWithin,
  chain,
  chainFluent,
};
