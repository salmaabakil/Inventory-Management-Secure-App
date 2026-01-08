# Projet Micro-services Sécurisé (Spring Boot + React + Keycloak)

Ce projet est une application de démonstration d'architecture micro-services sécurisée.

## Architecture

- **Frontend**: React (Vite)
- **API Gateway**: Spring Cloud Gateway
- **Services Backend**: Product Service, Order Service (Spring Boot 3)
- **Sécurité**: OAuth2 / OpenID Connect avec Keycloak
- **Base de données**: PostgreSQL

## Prérequis

- Docker & Docker Compose
- Java 17+ (pour le développement local)
- Node.js 18+ (pour le développement local)

## Démarrage Rapide (Docker)

1.  **Lancer l'infrastructure complète :**
    ```bash
    docker-compose up --build -d
    ```

2.  **Configuration Keycloak (Obligatoire)**
    - Accéder à `http://localhost:8080` (Admin: `admin` / `admin`).
    - Créer un Realm nommé `ecommerce`.
    - Créer un Client `frontend`:
        - Client authentication: Off (Public)
        - Valid Redirect URIs: `http://localhost:3000/*`
        - Web Origins: `http://localhost:3000` (ou `*` pour dev)
    - Créer les Rôles de Realm : `ADMIN`, `CLIENT`.
    - Créer un utilisateur Admin (assigner rôle `ADMIN`).
    - Créer un utilisateur Client (assigner rôle `CLIENT`).

3.  **Accéder à l'application**
    - Frontend: `http://localhost:3000`
    - Gateway: `http://localhost:9090`
    - PgAdmin (si activé): `http://localhost:5050`

## DevSecOps

Des scripts de vérification sont disponibles dans le dossier `devsecops/`.

- **Scan Trivy**: `trivy image msvc-product`
- **SonarQube**: Configuré via `sonar-project.properties`.

## Notes Techniques
- L'API Gateway propage le Token JWT aux micro-services.
- Le Frontend utilise `react-oidc-context` pour gérer le flux PKCE.
