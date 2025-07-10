#!/bin/bash
service postgresql start
su - postgres -c "psql -U postgres -v ON_ERROR_STOP=1 <<-EOSQL
  CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  CREATE DATABASE db OWNER ${DB_USER};
  GRANT ALL PRIVILEGES ON DATABASE db TO ${DB_USER};
EOSQL"
npm start
