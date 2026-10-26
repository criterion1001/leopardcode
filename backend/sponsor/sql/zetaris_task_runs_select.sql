SELECT status, COUNT(*) AS runs
FROM LEOPARDCODE_RUNS.task_runs
GROUP BY status
ORDER BY status;
