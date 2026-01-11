#!/usr/bin/env bash
set -euo pipefail

echo "============================================="
echo "      STARTING DEVSECOPS SECURITY SCAN "
echo "============================================="

cd "$(dirname "$0")/.."

SEVERITY="${SEVERITY:-HIGH,CRITICAL}"
TRIVY_EXIT="${TRIVY_EXIT:-0}"          # 0 local, 1 CI
FAIL_CVSS="${FAIL_CVSS:-7}"            # seuil Dependency-Check

# Services buildés dans ton docker-compose
SERVICES_TO_SCAN=("product-service" "order-service" "gateway-service" "frontend")

echo ""
echo "[0/3] Ensuring images are built..."
docker compose build "${SERVICES_TO_SCAN[@]}"

echo ""
echo "[1/3] Resolving Docker Compose image names..."
# Récupère les images réellement générées par docker compose
# On filtre sur les services qui nous intéressent
mapfile -t IMAGES < <(
  docker compose images --format json \
  | python3 - <<'PY'
import json,sys
services=set(["product-service","order-service","gateway-service","frontend"])
for line in sys.stdin:
    if not line.strip(): 
        continue
    obj=json.loads(line)
    svc=obj.get("Service","")
    img=obj.get("Repository","")
    tag=obj.get("Tag","")
    if svc in services and img and tag and tag != "<none>":
        print(f"{img}:{tag}")
PY
)

if [[ "${#IMAGES[@]}" -eq 0 ]]; then
  echo "ERROR: Could not resolve images from 'docker compose images'."
  echo "Tip: run 'docker compose images' and check output."
  exit 1
fi

echo "Images to scan:"
for img in "${IMAGES[@]}"; do
  echo " - $img"
done

echo ""
echo "[2/3] Running Trivy Container Scan..."
run_trivy() {
  local image="$1"
  echo " -> $image"
  trivy image --exit-code "$TRIVY_EXIT" --severity "$SEVERITY" "$image"
}

if command -v trivy &> /dev/null; then
  for img in "${IMAGES[@]}"; do
    run_trivy "$img"
  done
else
  echo "Trivy not found locally. Using Docker..."
  for img in "${IMAGES[@]}"; do
    echo " -> $img"
    docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      aquasec/trivy:latest image --exit-code "$TRIVY_EXIT" --severity "$SEVERITY" "$img"
  done
fi

echo ""
echo "[3/3] Running OWASP Dependency Check (via Maven container)..."
for SERVICE in product-service order-service gateway-service; do
  echo " -> Scanning $SERVICE..."
  docker run --rm \
    -v "$(pwd)/backend/$SERVICE":/usr/src/app \
    -v "$HOME/.m2":/root/.m2 \
    -w /usr/src/app \
    maven:3.9-eclipse-temurin-17 \
    mvn -q org.owasp:dependency-check-maven:check \
      -Dformat=HTML,JSON \
      -DfailBuildOnCVSS="$FAIL_CVSS"
done

echo ""
echo "[4/3] Static Analysis (Sonar)..."
if [[ -n "${SONAR_HOST_URL:-}" && -n "${SONAR_TOKEN:-}" ]]; then
  docker run --rm \
    -e SONAR_HOST_URL="$SONAR_HOST_URL" \
    -e SONAR_TOKEN="$SONAR_TOKEN" \
    -v "$(pwd)":/usr/src \
    sonarsource/sonar-scanner-cli
else
  echo "Sonar not configured (SONAR_HOST_URL/SONAR_TOKEN missing). Skipping."
fi

echo ""
echo "============================================="
echo "         SECURITY SCAN COMPLETE"
echo "============================================="
