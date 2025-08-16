all:
	docker build -t backend .
	docker run --env-file=.env -p 3000:3000 -p 5432:5432 -ti backend