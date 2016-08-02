const {
  curry,
} = require('./functional');

// doWithin :: monad -> ((...a) -> m b) -> (...m a) -> m b
const doWithin = monad =>

  // funcOfRegularValues :: (...a) -> m b
  // Represents the computation we want to run in the context of the monad.
  funcOfRegularValues =>
    // The monad values we want to run the computation on.
    (monadValue, ...nextMonadValues) =>
      // We want to do stuff to the values inside the monads,
      // but we only know how to operate on normal values,
      // so we unpack the value contained in the first monad
      // the only way we know how, by using the monad's "bind" method.
      monad.bind(monadValue)(value => (
        // The monad's "bind" method signature tells us we need to return a monad value
        // from the function we're in right now. Where shall we get it...
        nextMonadValues.length > 0 ?
          // 1) If there are more monads in the chain,
          // we return our computation carried on on the rest of them,
          // adding the data collected so far (value) to the computation.
          //
          // We use currying to do the trick, ensuring the normal function will only
          // be called once all remaining monads have had their say in it.
          //
          // The following call is just a form of enhanced recursion (we call doWithin)
          // where we propagate some state in addition to recursing.
          doWithin(monad)(
            curry(funcOfRegularValues, nextMonadValues.length + 1)(value)
          )(...nextMonadValues) :

          // 2) But if there are no more monads, our job is done, and
          // we just return a single monad value produced by our normal
          // function and decorated by the monad's "make" method.
          funcOfRegularValues(value)
      ))
;

// inject :: monad -> ((...a) -> b) -> (...m a) -> m b
const inject = monad => funcOfRegularValues =>
  doWithin(monad)((...values) => monad.make(funcOfRegularValues(...values)))
;

const chain = monad =>
  (monadicFunction, ...nextMonadicFunctions) =>
    initialMonadicValue => (
      nextMonadicFunctions.length > 0 ?
        monad.bind(initialMonadicValue)(
          normalValue => chain(monad)(...nextMonadicFunctions)(
            monadicFunction(normalValue)
          )
        ) :
      monad.bind(initialMonadicValue)(monadicFunction)
  )
;

module.exports = {
  inject,
  doWithin,
  chain,
};
