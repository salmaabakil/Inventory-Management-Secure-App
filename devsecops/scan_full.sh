#!/bin/bash

echo "============================================="
echo "   🛡️  STARTING DEVSECOPS SECURITY SCAN 🛡️"
echo "============================================="

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

# 1. TRIVY SCAN (Container Security)
echo ""
echo "[1/3] Running Trivy Container Scan..."
# Check if Trivy is installed, otherwise use Docker
if command -v trivy &> /dev/null; then
    trivy image --exit-code 0 --severity HIGH,CRITICAL msvc-product
    trivy image --exit-code 0 --severity HIGH,CRITICAL msvc-order
    trivy image --exit-code 0 --severity HIGH,CRITICAL msvc-gateway
else
    echo "Trivy not found locally. Using Docker..."
    # Note: This requires access to the images. If they are local only, might need to save/load or share socket.
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL msvc-product:latest
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL msvc-order:latest
fi

# 2. OWASP DEPENDENCY CHECK (Software Composition Analysis)
echo ""
echo "[2/3] Running OWASP Dependency Check (via Maven)..."
# We run this on the backend services. Using a Docker container to avoid needing local Maven setup if not present.
# But since user has docker-compose, likely better to just use a maven container mounting the volume.

for SERVICE in product-service order-service gateway-service; do
    echo " -> Scanning $SERVICE..."
    docker run --rm -v "$(pwd)/backend/$SERVICE":/usr/src/app -w /usr/src/app maven:3.9-eclipse-temurin-17 \
        mvn org.owasp:dependency-check-maven:check -Dformat=SUMMARY
done

# 3. STATIC CODE ANALYSIS (SonarQube)
echo ""
echo "[3/3] Running Static Analysis (SonarQube/SonarCloud)..."
echo "Note: This requires a running SonarQube server or SonarCloud token."
echo "Skipping execution for this local demo to avoid failure."
# Example command if server was available:
# docker run \
#     --rm \
#     -e SONAR_HOST_URL="http://localhost:9000" \
#     -e SONAR_LOGIN="my-token" \
#     -v "$(pwd)":/usr/src \
#     sonarsource/sonar-scanner-cli

echo ""
echo "============================================="
echo "   ✅ SECURITY SCAN COMPLETE"
echo "============================================="
