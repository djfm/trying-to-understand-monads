const {
  curry,
} = require('../lib/functional');

describe('Some General Purpose Functional Programming Utilities', () => {
  describe('"curry" lets you feed arguments to a function one by one', () => {
    it('does not alter a function of zero arguments',
      () => curry(() => 1)().should.equal(1)
    );

    it('does not alter a function of one argument',
      () => curry(x => x)(1).should.equal(1)
    );

    it('turns sub(a, b) into sub(a)(b)',
      () => curry((a, b) => a - b)(1)(1).should.equal(0)
    );

    it('can curry a curried function',
      () => curry(curry((a, b) => a - b))(1)(1).should.equal(0)
    );

    it('treats (a, b) like (a)(b)',
      () => {
        curry((a, b, c) => a - b + c)(1)(2)(3).should.equal(2);
        curry((a, b, c) => a - b + c)(1, 2)(3).should.equal(2);
        curry((a, b, c) => a - b + c)(1)(2, 3).should.equal(2);
      }
    );
  });
});
