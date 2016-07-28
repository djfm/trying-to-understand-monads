describe('Deriving Monads from OOP', () => {
  context('I have a simple vector class that can add another vector...', () => {
    class Vector {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }

      add(otherVector) {
        return new Vector(
          this.x + otherVector.x,
          this.y + otherVector.y
        );
      }
    }

    specify('it supports a fluent API, I can do vector.add(otherVector)', () => {
      new Vector(1, 2).add(new Vector(3, 4)).should.deep.equal({
        x: 4,
        y: 6,
      });
    });

    specify('...but hell, my API produced a list of vectors that I need to sum!', () => {
      class SmarterVector extends Vector {
        static add(firstVector, ...nextVectors) {
          return nextVectors.reduce(
            (sumSoFar, vectorToAdd) => sumSoFar.add(vectorToAdd),
            firstVector
          );
        }
      }

      const vectors = [
        new Vector(1, 2),
        new Vector(3, 4),
        new Vector(5, 6),
      ];

      SmarterVector.add(...vectors).should.deep.equal({
        x: 9,
        y: 12,
      });
    });
  });
});
