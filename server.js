console.time('Upload');
var express      = require('express'),
    app          = express(),
    multer       = require('multer'),
    fs           = require('fs'),
    mysql        = require('mysql'),
    http         = require('http'),
    sys          = require('sys'),
    util         = require('util'),
    assert       = require('assert');
    csv          = require('csv'),
    _            = require('underscore'),
    http         = require('http'),
    async = require('async')
    CSVConverter = require("./node_modules/csvtojson/libs/core/csvConverter.js");
var data, queue, stream;
var pool = mysql.createPool({
    host : 'localhost',
    port : 8889,
    database: 'partsxpo',
    user : 'root',
    password : 'root'
});
var sql = "INSERT INTO products (sku, name) VALUES (?)";

// Connect to mySql (if there is an erro, report it and terminate de request)
/*connection.connect(function(err){
    if(err) {
        console.error('Error connecting to mysql:' + err+'\n');
    }
    console.log('Connected as ID ' + connection.threadId);
});
*/
app.configure(function () {
    app.use(multer({
        dest: './static/uploads/',
        rename: function (fieldname, filename) {
            return filename.replace(/\W+/g, '-').toLowerCase();
        }
    }));
    app.use(express.static(__dirname + '/static'));
});

app.post('/api/upload', function (req, res) {
    csv()
    .from.stream(fs.createReadStream(req.files.userFile.path))
    .to.path(__dirname+'/stuff.json')
    .transform( function(row){
        row.unshift(row.pop());
        return row;
    })
    .on('record', function(row,index){
        var record = row;
        async.forever(function(callback) {
    pool.getConnection(function (err, connection) {
        if(err) throw err;
            connection.query(sql, [record], function(err, rows, fields) {
                    connection.release(callback);
                    if (err) throw err;
                    //console.log('The solution is: ', rows[0].solution);
                });
        });  
    },
    function (err) {
        console.log(err);  
    });
})
    .on('end', function(count){
        console.log('Number of records: '+count);
        console.timeEnd('Upload');

    })
    .on('error', function(error){
        console.log(error.message);
    });

  });

var server = app.listen(3000, function () {
    console.log('listening on port %d', server.address().port);
});