const {
  curry,
} = require('./functional');

const withMonad = monad =>
  funcOfMonadHelpers => {
    // inject :: ((...a) -> b) -> (...m a) -> m b
    const inject = funcOfRegularValues =>
      (monadValue, ...nextMonadValues) =>
        monad.bind(monadValue)(value => (
          nextMonadValues.length > 0 ?
            inject(curry(funcOfRegularValues)(value))(...nextMonadValues) :
            monad.make(funcOfRegularValues(value))
        ))
    ;

    return funcOfMonadHelpers({ inject });
  }
;

const inject = monad => funcToInject => (...monadValues) =>
  withMonad(monad)(
    ({ inject: monadInject }) => monadInject(funcToInject)(...monadValues)
  )
;

module.exports = {
  withMonad,
  inject,
};
