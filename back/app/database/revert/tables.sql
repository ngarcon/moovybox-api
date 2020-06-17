-- Revert moovybox:tables from pg

BEGIN;

-- XXX Add DDLs here.
DROP TABLE "user", "box", "item", "inventory", "move"; 

COMMIT;
