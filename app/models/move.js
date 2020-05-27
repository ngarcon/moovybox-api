const client = require('../db_client');

class Move {

    constructor(obj) {
        this.id = obj.id; 
        this.label = obj.label; 
        this.date = obj.date; 
        this.address = obj.address;
        this.user_id = obj.user_id; 
    }

    static async getAllFromUserId(userId) {
        try {
                
            const query = `SELECT * FROM "move" WHERE user_id = $1;`; 

            const values = [userId]; 

            const results = await client.query(query, values); 

            const instances = []; 

            for(const row of results.rows) {
                instances.push(new this(row)); 
            }

            return instances; 
        } catch (error) {
            console.log(error); 
        }
        // Method to retrieve all user moves and send them to client

    }

    static async getByPk(moveId) {
        try {
            
        const query = `SELECT * FROM "move" WHERE "id" = $1;`; 

        const values = [moveId]; 

        const results = await client.query(query, values); 

        return new Move(results.rows[0]); 
        } catch (error) {
            console.log(error);
        }
    }

    static async labelExists (obj) {
        //* Check the existence of the entred email in the DB
        try {
            // request to find an associated user
            const query = `SELECT * FROM "move" WHERE "label" = $1 AND user_id = $2`; 
            const results = await client.query(query, [obj.moveLabel, obj.userId]); 
            
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
        // Insert a move in DB 
        // expected (label, date, adress and user id); 
        // user id to get from session. 
        try {
            
            const query = `INSERT INTO "move" (label, date, address, user_id) VALUES ($1, $2, $3, $4) RETURNING *`; 
    
            const values = [this.label, this.date, this.address, this.user_id]; 
    
            const results = await client.query(query, values); 
             
            return  new Move(results.rows[0]); 
        } catch (error) {
            console.trace(error);
        }
    }

    async update() {
        
        try {
            // Prepare the query
            const query = `UPDATE "move" SET ("label", "date", "address") = ($1, $2, $3) WHERE "id" = $4 AND "user_id" = $5 RETURNING * ;`;
            
            // prepare values
            const values = [this.label, this.date, this.address, this.id, this.user_id]; 
            
            // Query update to DB 
            const result = await client.query(query, values); 
        
            //return the updated move
            return new Move(result.rows[0]); 
        } catch (error) {
            console.trace(error);
        }
    }

    async delete() {

        try {
            // Select a move 
            const query = `DELETE FROM "move" WHERE "id"= $1;`; 

            // Delete the move
            const result = await client.query(query, [this.id]);

            //console.log('result :>> ', result);

            // return boolean
            // true : delete ok
            // false : delete failed
            return !!result.rowCount; 
        } catch (error) {
            console.trace(error);
        }
    }
};

module.exports = Move; 