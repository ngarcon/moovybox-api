-- Deploy moovybox:tables to pg
BEGIN;

CREATE TABLE "user" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "pseudo" TEXT NOT NULL, 
    "email" TEXT NOT NULL CHECK ("email" ~* '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$') UNIQUE,
    "password" TEXT NOT NULL CHECK ("password" ~* '^.{60}$')
); 

CREATE TABLE "move" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "label" TEXT NOT NULL, 
    "date" DATE NOT NULL, 
    "address" TEXT, 
    "user_id" INT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    CONSTRAINT one_label_one_move UNIQUE("user_id","label")
); 

CREATE TABLE "box" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "code" TEXT NOT NULL, 
    "label" TEXT NOT NULL, 
    "destination_room" TEXT NOT NULL, 
    "fragile" BOOLEAN NOT NULL DEFAULT false, 
    "heavy" BOOLEAN NOT NULL DEFAULT false, 
    "floor" BOOLEAN NOT NULL DEFAULT false, 
    "user_id" INT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "move_id" INT NOT NULL REFERENCES "move"("id") ON DELETE CASCADE,
    CONSTRAINT one_box_one_user UNIQUE("user_id","id") 
); 

CREATE SEQUENCE box_code_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1 OWNED BY box.code;

ALTER TABLE "box" ALTER "code" SET DEFAULT lpad(to_hex(nextval('box_code_seq')), 8, '0');

CREATE TABLE "item" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL, 
    "user_id" INT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "box_id" INT NOT NULL REFERENCES "box"("id") ON DELETE CASCADE,
    CONSTRAINT one_item_one_box UNIQUE("box_id","id")
); 

CREATE TABLE "inventory" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL
); 

COMMIT;