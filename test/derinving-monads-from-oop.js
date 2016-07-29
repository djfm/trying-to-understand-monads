describe('Deriving Monads from OOP', () => {
  context('I have a simple vector class that can "add" and "sub" another vector...', () => {
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

      sub(otherVector) {
        return new Vector(
          this.x - otherVector.x,
          this.y - otherVector.y
        );
      }
    }

    specify('it supports a fluent API, I can do vector.add(otherVector)', () => {
      new Vector(1, 2).add(new Vector(3, 4)).should.deep.equal({
        x: 4,
        y: 6,
      });
    });

    specify('it supports a fluent API, I can do vector.sub(otherVector)', () => {
      new Vector(1, 2).sub(new Vector(3, 4)).should.deep.equal({
        x: -2,
        y: -2,
      });
    });

    context('...but hell, my API produced a list of vectors...', () => {
      specify('...and I need to sum them all!', () => {
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

      specify('...and I need to sub them all for some reason!', () => {
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
});
