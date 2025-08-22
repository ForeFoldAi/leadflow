variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "database_url" {
  description = "PostgreSQL database connection URL"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "leadconnect-server"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
} 