# Nom du projet
PROJECT_NAME = ft_transcendence

# Commandes Docker
DOCKER_COMPOSE = docker-compose
DOCKER = docker

# Services définis dans docker-compose.yml
SERVICES = api-gateway auth-service game-service

# Chemins des dossiers des services
SERVICE_DIRS = $(addprefix services/,$(SERVICES))

all: build up

# Construire les images Docker
build:
	$(DOCKER_COMPOSE) build --no-cache

# Lancer tous les services
up:
	$(DOCKER_COMPOSE) up -d

# Arrêter tous les services
down:
	$(DOCKER_COMPOSE) down

# Redémarrer les services
restart: down up

re: clean build up

# Afficher les logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Nettoyer les images et conteneurs Docker
clean:
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans
	$(DOCKER system prune -af)
	$(DOCKER volume prune -f)

# Installer les dépendances Node.js pour chaque service
install:
	@for dir in $(SERVICE_DIRS); do \
		echo "📦 Installation des dépendances dans $$dir ..."; \
		cd $$dir && npm install && cd -; \
	done

# Démarrer chaque service séparément (utile pour debug)
run-gateway:
	cd services/api-gateway && npm start

run-auth:
	cd services/auth-service && npm start

run-game:
	cd services/game-service && npm start
