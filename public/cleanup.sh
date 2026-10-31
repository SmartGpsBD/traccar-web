#!/bin/bash

psql -U sazzad -h localhost -d traccar -c "DELETE FROM tc_events WHERE eventtime < NOW() - INTERVAL '365 days';"
psql -U sazzad -h localhost -d traccar -c "DELETE FROM tc_positions WHERE fixtime < NOW() - INTERVAL '64 days' AND id NOT IN (SELECT positionid FROM tc_devices WHERE positionid IS NOT NULL);"
pg_dump -U sazzad -h localhost -F c -b -f /var/www/html/download/backup.dump traccar