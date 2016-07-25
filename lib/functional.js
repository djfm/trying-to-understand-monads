const curry = func => (...knownArgs) => {
  if (knownArgs.length >= func.length) {
    return func(...knownArgs);
  }
  return (...args) => curry(func)(...knownArgs, ...args);
};

module.exports = {
  curry,
};
