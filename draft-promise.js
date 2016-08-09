/* eslint-disable no-console, no-undef, no-unused, prefer-arrow-callback */

const p = require('./lib/promise');

const rejected = x => Promise.reject(x);

const notCalled = msg => () => {
  console.log(msg);
};

const neverFulfilled = () => new Promise(() => {
});

p.rejected('dummy').then(null, () => p.deferred().promise).then(
  notCalled('resolve'),
  notCalled('reject')
);

const presolve = x => console.log('resolved', x) || Promise.resolve(x);
const preject = x => console.log('rejected', x) || Promise.reject(x);

preject('dummy')
  .then(() => presolve('a'), () => preject('b'))
  .then(null, () => presolve('c'))
  .then(presolve, preject)
;


// then ::
//  (state, a) ->
//
//    ((a -> (state, b)), (a -> (state, b))) ->
//      (state, b)

const resolve = value => ({
  state: 'resolve',
  value,
});

const reject = value => ({
  state: 'reject',
  value,
});

const chain = (...computations) => initialStatefulResult =>
  computations.reduce(
    ({ state, value }, computation) => {
      try {
        return (computation[state] || resolve)(value);
      } catch (e) {
        return reject(e);
      }
    },
    initialStatefulResult
  )
;

const x = chain(
  { resolve: () => resolve('a'), reject: () => reject('b') },
  { reject: () => resolve('c') },
  { resolve }
);

console.log(x(resolve('dummy')));
console.log(x(reject('dummy')));
