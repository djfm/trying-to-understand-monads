# Trying To Understand Monads

I'm very interested in monads, but as [you can see](https://wiki.haskell.org/Monad_tutorials_timeline) it is
such a tricky subject that tutorials about monads are produced with exponential growth.

It is also said that, once you understand monads, you cannot explain them any longer.

Like many before me, I'd like to prove this saying wrong eventually :)

## Motivation

Lately I have been having the feeling that monads come up more and more in what I develop,
but always in some kind of ad-hoc, poorly designed fashion.

Since none of the tutorials listed above gave me the total enlightenment I'm after,
I figured I might as well try to "implement monads" myself and see what comes out of it.

## Project Goals

This project is a **toy project** where my goal is to implement useful, generic methods
to make use of monads in JS.

I love Haskell and at first I'm trying to reproduce here the use cases I'm familiar with in Haskell.
