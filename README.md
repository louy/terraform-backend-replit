# Terraform Backend: Repl.it

A [terraform backend](https://www.terraform.io/docs/backends/types/http.html) implementation using repl.it. Can be used with free accounts as well.

## So what's this?

This repo contains a [repl.it "repl"](https://repl.it/site/about) that can be used as a remote state backend for terraform. The advantage of storing this in something like repl.it instead of AWS S3 is that it's much easier to set up, and some of my hobby projects tend to use repl.it anyway. Plus it's free!

This backend supports state locks and an having arbitrary number of terraform states on a single worker (using different pathnames).

## Getting started

To use this as a backend, all you need is to [open the public repl](https://repl.it/@louy/terraform-backend-replit) for this repo and fork it, then change the secret values.

### Secret values

To use this backend, you'll need to set a private username and password. These can be pretty much anything. The server would launch until you set them, so what you need to do is create a file in your repl.it called `.env` and add the following:

```
USERNAME=changeme
PASSWORD=changeme
```

Personally I use the following command to generate random values each time:

```
openssl rand -hex 32
```

According to [the docs](https://docs.repl.it/repls/secret-keys) your `.env` file is private, even when you use a public repl, but you can always use a private repl if you have a paid account.

Congrats! Once you've saved your changes you're good to go!

Use the replit preview url as your backend url in your terraform config. Check out the `example` folder on how to set that up. It'll look something like this:

```hcl
terraform {
  backend "http" {
    address        = "https://terraform-backend-replit.louy.repl.co"
    username       = "CHANGE ME!"
    password       = "CHANGE ME!"
    lock_address   = "https://terraform-backend-replit.louy.repl.co"
    unlock_address = "https://terraform-backend-replit.louy.repl.co"
  }
}
```

**Caution:** Changing your credentials after running `terraform init` is not supported as it's not straightforward. If that's needed, try taking a copy of your state before changing your credentials, then uploading it after you make the change:

```sh
# Before changing your credentials
tf state pull > state-backup.tfstate

# Change your credentials on repl.it and save
# ...

# After changing your credentials (including in the terraform config)
tf state push state-backup.tfstate
```
