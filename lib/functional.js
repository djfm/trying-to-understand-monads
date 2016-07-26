const curry = (func, length) => (...knownArgs) => {
  const callAtLength = length === undefined ? func.length : length;
  if (knownArgs.length >= callAtLength) {
    return func(...knownArgs);
  }
  return (...args) => curry(func, length)(...knownArgs, ...args);
};

module.exports = {
  curry,
};
