CREATE LIGHTNING DATABASE LEOPARDCODE_RUNS DESCRIBE BY "leopardcode task runs";

CREATE LIGHTNING FILESTORE TABLE task_runs
FROM LEOPARDCODE_RUNS
FORMAT CSV
OPTIONS (
  PATH "/home/zetaris/customer-data/shared/task_runs.csv",
  header "true",
  inferSchema "true"
);
