all: run

DATABASE_DIR := $(shell pwd)/Database

build:
	mkdir -p "$(DATABASE_DIR)"
	docker build -t fastify .

run: build
	docker run -p 3001:3000 -v "$(DATABASE_DIR):/app/data" fastify

prune:
	docker system prune -a

kill:
	lsof -ti :3001 | xargs kill -9
