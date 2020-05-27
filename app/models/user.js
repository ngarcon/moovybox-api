const client = require('../db_client');
const bcrypt = require('bcrypt');
const salt = parseInt(process.env.SALT, 10);

class User {

    constructor(obj){
        this.id = obj.id; 
        this.pseudo = obj.pseudo; 
        this.email = obj.email; 
        this.password = obj.password;
        this.confirmed = obj.confirmed;
    }

    static async emailExists (email) {
        //* Check the existence of the entred email in the DB
        try {
            // request to find an associated user
            const query = `SELECT * FROM "user" WHERE "email" = $1`; 
            const results = await client.query(query, [email]); 
            
            // Returns a boolean 
            // - true : mail exists
            // - false : mail does not exist
            return !!results.rowCount; 
        } catch (error) {
            return console.trace(error); 
        }
    }

    static async confirmUser(userId) {
        try {
            // 
            const query = `UPDATE "user" SET "confirmed"='true' WHERE "id"=$1 RETURNING *;`; 

            const result = await client.query(query, [userId]); 

            return result.rows[0]; 
            
        } catch (error) {
            return console.trace(error); 
        }
    }

    static async findByPk(id) {
        try {
            // prepare de query 
            const query = `SELECT * FROM "user" WHERE "id" = $1`; 
            const values = [id]; 
            // make query to DB 

            const results = await client.query(query, values); 
            // check answer
                // If one found return value 
                // Esle return error "ressource not found" 401

               // console.log(results); 
            return (!!results.rows[0]) ? new this(results.rows[0]) : false; 
            
        } catch (error) {
            console.trace(error);
        }
    }

    static async findByEmail(email) {
        try {
            // prepare de query 
            const query = `SELECT * FROM "user" WHERE email = $1`; 
            const values = [email]; 
            // make query to DB 

            const results = await client.query(query, values); 
            // check answer
                // If one found return value 
                // Esle return error "ressource not found" 401

               // console.log(results); 
            return (!!results.rows[0]) ? new this(results.rows[0]) : false;  
            
        } catch (error) {
            console.trace(error);
        }
    }

    async insert() {
        //* Save user in DB 
        try {
            // request to find an associated user
            const query = `INSERT INTO "user" (pseudo, email, password) VALUES ($1, $2, $3) RETURNING *`; 
            
            // value table setting
            const values = [this.pseudo, this.email, this.password]; 

            const results = await client.query(query, values); 
            console.log("insert results",results);
            // Returns created entity
            return (!!results.rows[0]) ? new User(results.rows[0]) : false;
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

    async update() {
        try {
            // request to find an associated user
            const query = `UPDATE "user" SET "email" = $1, "pseudo" = $2, "password" = $3 WHERE "id" = $4 RETURNING * ;`; 
            // value table setting
            const values = [this.email, this.pseudo, this.password, this.id];

            const results = await client.query(query, values); 

            console.log("update email results",results.rows[0]);
            // Returns a boolean 
            // - true : mail changed
            // - false : mail did not change
            return (!!results.rows[0]) ? new User(results.rows[0]) : false; 
        } catch (error) {
            return console.trace(error); 
        }
    }

    async delete() {
        try {
            // request to find an associated user
            const query = `DELETE FROM "user" WHERE "id" = $1 RETURNING * ;`; 
            // value table setting
            const values = [this.id];

            const results = await client.query(query, values); 

            // Returns a boolean 
            // - true : user is deleted
            // - false : user is not deleted
            return !!results.rowCount; 
        } catch (error) {
            return console.trace(error); 
        }
    }

}; 

module.exports = User; 