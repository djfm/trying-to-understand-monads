const {
  inject,
} = require('../lib/glue');

const makeTaxMonad = taxRate => {
  const taxInclPrice = n => ({ taxIncl: n });
  const taxExclPrice = n => ({ taxExcl: n });

  const taxIncludedMonad = {
    make: taxInclPrice,
    bind: price => priceReturningFunction =>
      priceReturningFunction(
        ('taxExcl' in price) ?
          price.taxExcl * (1 + taxRate) :
          price.taxIncl
      ),
  };

  const taxIncludedDo = inject(taxIncludedMonad);

  return {
    taxInclPrice,
    taxExclPrice,
    taxIncludedDo,
  };
};

describe('Experimental Use Cases', () => {
  describe('the tax monad', () => {
    const t = makeTaxMonad(0.2);

    it('should add a tax incl and a tax excl price', () =>
      t.taxIncludedDo((x, y, z) => x + y + z)(
        t.taxInclPrice(5),
        t.taxExclPrice(10),
        t.taxExclPrice(10)
      ).should.deep.equal({ taxIncl: 29 })
    );
  });
});
