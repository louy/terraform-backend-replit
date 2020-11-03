terraform {
  backend "http" {
    address        = "https://terraform-backend-replit.louy.repl.co"
    username       = "CHANGE ME!"
    password       = "CHANGE ME!"
    lock_address   = "https://terraform-backend-replit.louy.repl.co"
    unlock_address = "https://terraform-backend-replit.louy.repl.co"
  }
}
