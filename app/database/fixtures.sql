BEGIN; 
INSERT INTO "user" (pseudo, email, "password") VALUES 
('Nicolas', 'nicolas.garcon@gmail.com', '015236587401523658740152365874015236587401523658740152365874'),
('Annabelle', 'a.aubousdormant@labelle.dor', '01523658740152365874015236j587401523658740152365874015546987'); 
COMMIT; 

BEGIN; 
INSERT INTO "move" ("label", "date", "address", "user_id") VALUES 
('Chez papy', '13/06/2020', ' 13 allée des rossignols, Bourg-en-Brest', 1);  
COMMIT; 

BEGIN; 
INSERT INTO "box" ("label", "destination_room", "move_id", "user_id") VALUES 
('Jouets Agnès', 'chambre d''agnès', 1, 1);  
COMMIT; 

BEGIN; 
INSERT INTO "item" ("name", "box_id", "user_id") VALUES 
('Peluche de pokemon',1 , 1);  
COMMIT; 


-- Test the presence of every table

-- SELECT item.name, "move".label, box.code, "user"."pseudo"
-- FROM "item" JOIN "box" ON item.box_id = box.id
-- JOIN "move" ON box.move_id = "move".id
-- JOIN "user" ON box.user_id = "user".id 


-- Kill all sessions for my_db

-- select pg_terminate_backend(pid) from pg_stat_activity WHERE datname = 'moovybox_test';
