const client = require('../db_client');

class Item {

    constructor(obj) {
        this.id = obj.id; 
        this.name = obj.name;
        this.box_id = obj.box_id; 
        this.user_id = obj.user_id;
    }

    static async getByPk(itemId) {
        // Method to retrieve all user item and send them to client

        const query = `SELECT * FROM "item" WHERE id = $1;`; 

        const values = [itemId]; 

        const results = await client.query(query, values); 

        return (results.rows[0]) ? new this(results.rows[0]) : false; 
    }

    static async getAllInBox(boxId) {
        // Method to retrieve all user item and send them to client

        const query = `SELECT * FROM "item" WHERE box_id = $1;`; 

        const results = await client.query(query, [boxId]); 

        const instances = []; 

        for(const row of results.rows) {
            instances.push(new this(row)); 
        }

        return instances; 
    }

    static async itemNameExistsInBox (form) {
        //* Check the existence of the item in the same box in the DB
        try {
            // request to find an associated user
            const query = `SELECT * FROM "item" WHERE "name" = $1 AND user_id = $2 AND box_id=$3;`; 
            const results = await client.query(query, [form.name, form.user_id, form.box_id]); 
            
            // Returns a boolean 
            // - true : name exists
            // - false : name does not exist
            return results.rows[0]; 
        } catch (error) {
            return console.trace(error); 
        }
    }

    static async search (data) {
        //* Research function
        try {

            const query = `SELECT row_to_json(get_move_boxes_and_content($1, $2)); `; 
            // TODO  : accept 
            const values = [data.user_id, data.move_id]; 

            const answerFromDB = await client.query(query, values); 

            const results = answerFromDB.rows.map(entry => entry.row_to_json); 

            return results; 
             
        } catch (error) {
            console.log(error);
        }
    }

    async insert() {
        // Insert a item in DB 
        try {
            
            const query = `INSERT INTO "item" (name, user_id, box_id) VALUES ($1, $2, $3) RETURNING *`; 
    
            const values = [ this.name, this.user_id, this.box_id]; 
    
            const results = await client.query(query, values); 
    
            return new Item(results.rows[0]); 
        } catch (error) {
            console.trace(error);
        }
    }

    async update() {
        // Insert a item in DB 
        try {
            
            const query = `UPDATE "item" SET ("name", "box_id") = ($1, $2) WHERE "id" = $3 RETURNING *;`; 
    
            const values = [this.name, this.box_id, this.id]; 
    
            const results = await client.query(query, values); 
    
            return new Item(results.rows[0]); 
        } catch (error) {
            console.trace(error);
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


    async delete() {

        try {
            // Select a item 
            const query = `DELETE FROM "item" WHERE "id"= $1;`; 

            // Delete the item
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

module.exports = Item; 