-- Verify moovybox:tables on pg

BEGIN;

-- XXX Add verifications here.
SELECT item.name, "move".label, box.code, "user"."pseudo"
FROM "item" JOIN "box" ON item.box_id = box.id
JOIN "move" ON box.move_id = "move".id
JOIN "user" ON box.user_id = "user".id WHERE FALSE; 

ROLLBACK;
