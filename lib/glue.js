const {
  curry,
} = require('./functional');

// inject :: ((...a) -> b) -> (...m a) -> m b
const inject = monad =>
  funcOfRegularValues =>
    (monadValue, ...nextMonadValues) =>
      monad.bind(monadValue)(value => (
        nextMonadValues.length > 0 ?
          inject(monad)(
            curry(funcOfRegularValues, nextMonadValues.length + 1)(value)
          )(...nextMonadValues) :
          monad.make(funcOfRegularValues(value))
      ))
;

module.exports = {
  inject,
};
