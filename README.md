# Terraform Backend: Repl.it

A [terraform backend](https://www.terraform.io/docs/backends/types/http.html) implementation using repl.it. Requires a Paid account to get a private repl.

## So what's this?

This repo contains a [repl.it "repl"](https://repl.it/site/about) that can be used as a remote state backend for terraform. The advantage of storing this in something like repl.it instead of AWS S3 is that it's much easier to set up, and some of my hobby projects tend to use repl.it anyway.

This backend supports state locks and an having arbitrary number of terraform states on a single worker (using different pathnames).
