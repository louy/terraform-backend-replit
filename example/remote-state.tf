terraform {
  backend "http" {
    address        = "https://terraform-backend-replit.louy.repl.run"
    username       = "CHANGE ME!"
    password       = "CHANGE ME!"
    lock_address   = "https://terraform-backend-replit.louy.repl.run"
    unlock_address = "https://terraform-backend-replit.louy.repl.run"
  }
}
