.PHONY: up down build restart

up:
	docker compose up

down:
	docker compose down

build:
	docker builder prune -f
	docker compose build --no-cache

restart:
	docker compose down
	docker builder prune -f
	docker compose build --no-cache
	docker compose up
