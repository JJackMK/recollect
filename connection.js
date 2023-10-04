//MAMP
let mysql  = require('mysql');
let db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'stacks_of_wax',
    port: '8889' 
});

db.connect((err)=> {
    if(err) throw err;
});

module.exports = db;