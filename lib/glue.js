const {
  curry,
} = require('./functional');

const withMonad = monad =>
  funcOfMonadHelpers => {
    // inject :: ((...a) -> b) -> (...m a) -> m b
    const inject = funcOfRegularValues =>
      (monadValue, ...nextMonadValues) =>
          monad.bind(monadValue)(
            nextMonadValues.length > 0 ?
              value => inject(
                curry(funcOfRegularValues)(value)
              )(...nextMonadValues) :
              curry(funcOfRegularValues)
          )
    ;

    return funcOfMonadHelpers({ inject });
  }
;

module.exports = {
  withMonad,
};
