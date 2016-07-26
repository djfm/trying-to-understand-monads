const curry = (func, length = 0) => (...knownArgs) => {
  if (knownArgs.length >= (func.length || length)) {
    return func(...knownArgs);
  }
  return (...args) => curry(func, length)(...knownArgs, ...args);
};

module.exports = {
  curry,
};
