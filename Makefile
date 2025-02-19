all : run

build :
	mkdir -p "$(HOME)/Database"
	docker build -t fastify .

run : build
	docker run -p 3001:3000 -v "$(HOME)/Database/test.sqlite:/app/data/test.sqlite" fastify

prune :
	docker system prune -a

#In case of port already used by a process and blocking
kill :
	lsof -ti :3001 | xargs kill -9