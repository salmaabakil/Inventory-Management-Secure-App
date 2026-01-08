#!/bin/bash
# DevSecOps Scan Script (Example)

echo "Starting Security Scan..."

# 1. Dependency Check (OWASP) - Example command
# dependency-check.sh --project "Ecommerce" --scan .

# 2. Static Analysis (SonarQube)
# sonar-scanner -Dsonar.projectKey=ecommerce -Dsonar.sources=.

# 3. Docker Image Scan (Trivy)
echo "Scanning Docker Images with Trivy..."
# Ensure images are built first
trivy image ecommerce-product-service:latest
trivy image ecommerce-order-service:latest
trivy image ecommerce-gateway-service:latest
trivy image ecommerce-frontend:latest

echo "Scan Complete."
