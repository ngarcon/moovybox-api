const client = require('../db_client');

class Box {

    constructor(obj) {
        this.id = obj.id; 
        this.code = obj.code;
        this.label = obj.label; 
        this.destination_room = obj.destination_room;
        this.fragile = obj.fragile;
        this.heavy = obj.heavy;
        this.floor = obj.floor;
        this.user_id = obj.user_id;
        this.move_id = obj.move_id;  
    }

    static async getByPk(boxId) {
        // Method to retrieve a box if it matches with current user id and send them to client

        const query = `SELECT * FROM "box" WHERE "id" = $1;`; 

        const results = await client.query(query, [boxId]); 

        return (results.rows[0]) ? new this(results.rows[0]) : false; 
    }

    static async getAllByUserId(userId) {
        // Method to retrieve all user box and send them to client

        const query = `SELECT * FROM "box" WHERE user_id = $1;`; 

        const values = [userId]; 

        const results = await client.query(query, values); 

        const instances = []; 

        for(const row of results.rows) {
            instances.push(new this(row)); 
        }

        return instances; 
    }

    static async getAllFromMove(moveId) {
        // Method to retrieve all user boxes from one specific move and send them to client

        const query = `SELECT * FROM "box" WHERE move_id = $1;`; 

        const values = [moveId]; 

        const results = await client.query(query, values); 

        const instances = []; 

        for(const row of results.rows) {
            instances.push(new this(row)); 
        }

        return instances; 
    }

    static async boxLabelExists (form) {
        //* Check the existence of the entred box in the DB
        try {
            // request to find an associated user
            const query = `SELECT * FROM "box" WHERE "label" = $1 AND move_id = $2;`; 
            const results = await client.query(query, [form.label, form.move_id]); 
            
            // Returns a boolean 
            // - true : label exists
            // - false : label does not exist
            return !!results.rowCount; 
        } catch (error) {
            return console.trace(error); 
        }
    }

    async save() {
        try {

            if(!!this.id) {
               return this.update(); 
            } else {
               return this.insert(); 
            }
            
        } catch (error) {
            console.log(error); 
        }
    }

    async insert() {
        // Insert a box in DB 
        // expected (label, date, adress and user id); 
        // user id to get from session. 
        try {
            
            const query = `INSERT INTO "box" (label, destination_room, fragile, heavy, floor, user_id, move_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`; 
    
            const values = [ this.label, this.destination_room, this.fragile, this.heavy, this.floor, this.user_id, this.move_id]; 
    
            const results = await client.query(query, values); 
    
            return new Box(results.rows[0]);  
        } catch (error) {
            console.trace(error);
        }
    }

    async update() {
        
        try {
            // Prepare the query
            const query = `UPDATE "box" SET ("label", "destination_room", "fragile", "heavy", "floor") = ($1, $2, $3::boolean, $4::boolean, $5::boolean) WHERE "id" = $6 AND "user_id" = $7 RETURNING *;`;
            
            // Set the involved data
            const values = [this.label, this.destination_room, this.fragile.toString(), this.heavy.toString(), this.floor.toString(), this.id, this.user_id]; 
            
            // Query update to DB 
            const results = await client.query(query, values); 

            console.log("Box.update result", results); 
        
            //return the updated move
            return new Box(results.rows[0]); 
        } catch (error) {
            console.trace(error);
        }
    }

    async delete() {

        try {
            // Select a box 
            const query = `DELETE FROM "box" WHERE "id"= $1;`; 

            // Delete the box
            const result = await client.query(query, [this.id]);

            // return boolean
            // true : delete ok
            // false : delete failed
            return !!result.rowCount; 
        } catch (error) {
            console.trace(error);
        }
    }
};

module.exports = Box; 