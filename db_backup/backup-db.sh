#!/bin/bash

MYDB=$1
pg_dump -C -U gekkodbuser $MYDB | gzip -c | cat > $MYDB.sql.gz
