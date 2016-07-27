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
    make: taxExclPrice,
    bind: price => priceReturningFunction =>
      priceReturningFunction(
        ('taxIncl' in price) ?
          price.taxIncl / (1 + taxRate) :
          price.taxExcl
      ),
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

    describe('the same using traditional object programming', () => {
      class Price {
        constructor(amount, taxIncl) {
          this.amount = amount;
          this.taxIncl = taxIncl;
        }
      }

      class TaxEnvironment {
        constructor(rate, taxIncl) {
          this.rate = rate;
          this.taxIncl = taxIncl;
        }

        convertPriceAmount(price) {
          if (this.taxIncl === price.taxIncl) {
            return price.amount;
          }

          if (this.taxIncl) {
            return price.amount * (1 + this.rate);
          }

          return price.amount / (1 + this.rate);
        }

        addPrices(...prices) {
          // Too bad I cannot re-use my sum function!
          const amount = prices.reduce(
            (total, price) => total + this.convertPriceAmount(price),
            0
          );
          return new Price(amount, this.taxIncl);
        }
      }

      it('should add a tax incl and a tax excl price, presented as tax included', () => {
        const tE = new TaxEnvironment(0.2, true);
        tE.addPrices(
          new Price(5, true),
          new Price(10, false),
          new Price(10, false)
        ).should.deep.equal({
          amount: 29,
          taxIncl: true,
        });
      });

      it('should add a tax incl and a tax excl price, presented as tax excluded', () => {
        const tE = new TaxEnvironment(0.2, false);
        tE.addPrices(
          new Price(12, true),
          new Price(10, false),
          new Price(10, false)
        ).should.deep.equal({
          amount: 30,
          taxIncl: false,
        });
      });
    });
  });
});
