const {
  inject,
} = require('../lib/glue');

const sum = (...args) => args.reduce(
  (total, number) => total + number,
  0
);

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

  const taxExcludedMonad = {
    // make :: Number -> TaxExcl Number
    make: taxExclPrice,

    // bind :: TaxExcl Number -> (Number -> TaxExcl Number) -> TaxExcl Number
    bind: price => priceReturningFunction =>
      priceReturningFunction(
        ('taxIncl' in price) ?
          price.taxIncl / (1 + taxRate) :
          price.taxExcl
      ),

    /**
     * Proof of monad laws:
     * 1) Left Identity: bind(make(x), f) = f(x)
     *
     * bind(make(x), f) = f(('taxIncl' in make(x)) ? something : make(x).taxExcl)
     *                  = f(make(x).taxExcl)
     *                  = f({ taxExcl: x }.taxExcl)
     *                  = f(x)
     *
     *
     * 2) Right Identity: bind(m, make) = m
     *
     * bind(m, make) = make(('taxIncl' in m) ? convert(m.taxIncl) : m.taxExcl)
     *               = make(('taxIncl' in m) ? m.taxExcl : m.taxExcl)
     *               = make(m.taxExcl)
     *               = { taxExcl: m.taxExcl }
     *
     *
     * 3) Associativity: bind(bind(m, f), g) = bind(m, x => bind(make(x), g))
     *
     * bind(bind(m, f), g) = g(('taxIncl' in bind(m, f)) ?
     *                              convert(bind(m, f).taxIncl) :
     *                              bind(m, f).taxExcl)
     *                         )
     *                     = g(bind(m, f).taxExcl)
     *                     = g(f(('taxIncl' in m ? convert(m.taxIncl) : m.taxExcl)).taxExcl)
     *                     = g(f(m.taxExcl).taxExcl)
     *                     := A
     *
     * bind(m, x => bind(f(x), g))
     *     = (x => bind(f(x), g))(('taxIncl' in m) ? convert(m.taxIncl) : m.taxExcl)
     *     = (x => bind(f(x), g))(m.taxExcl)
     *     = bind(f(m.taxExcl), g)
     *     = g(('taxIncl' in f(m.taxExcl)) ? convert(f(m.taxExcl).taxIncl) : f(m.taxExcl).taxExcl)
     *     = g(f(m.taxExcl).taxExcl)
     *     = A
     *     = bind(bind(m, f), g) [QED]
     */
  };

  const taxIncludedDo = inject(taxIncludedMonad);
  const taxExcludedDo = inject(taxExcludedMonad);

  return {
    taxInclPrice,
    taxExclPrice,
    taxIncludedDo,
    taxExcludedDo,
  };
};

describe('Experimental Use Cases', () => {
  describe('the tax monad', () => {
    const t = makeTaxMonad(0.2);

    it('should add a tax incl and a tax excl price, presented as tax included', () =>
      t.taxIncludedDo(sum)(
        t.taxInclPrice(5),
        t.taxExclPrice(10),
        t.taxExclPrice(10)
      ).should.deep.equal({ taxIncl: 29 })
    );

    it('should add a tax incl and a tax excl price, presented as tax excluded', () =>
      t.taxExcludedDo(sum)(
        t.taxInclPrice(12),
        t.taxExclPrice(10),
        t.taxExclPrice(10)
      ).should.deep.equal({ taxExcl: 30 })
    );
  });
});
