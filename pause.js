var csv         = require('ya-csv') 
    ,optimist   = require('optimist') 
    ,colors     = require('colors') 
    ,util       = require('util') 
    ,fs         = require('fs') 
    ,path       = require('path') 
    ,headers    = [] 
    ,file_count = 1 
    ,data       = []
    ,argv
    ,filepath
    ,reader
    ,streamer; 
    
argv = optimist.usage( 
        "\nConverts large csv sets to json for indexing\n".bold + 
        "Usage:\n".magenta+ 
        "node csv_to_json.js -f /path/to/file.csv" 
        ) 
        .demand(['f']) 
        .options('f', { 
            alias:"file" 
            ,describe:"the path to a csv file" 
        }) 
        .argv; 
if( argv.help ){ 
    util.puts(optimist.help() ); 
    process.exit(0); 
} 
filepath = path.resolve( argv.file ); 
reader = csv.createCsvFileReader(filepath,{ 
    separator:',', 
    quote:'"', 
}); 
streamer = fs.createWriteStream('converted.json', { 
    flags:'w', 
    encoding:"utf-8" 
});
//start the json object
function hasher( arr ){ 
    ret = {};    
    arr.forEach(function( item ){ 
        ret[item[0]] = item[1]; 
    }); 
    return ret; 
}
// emulate python's zip function
function zip( arr1, arr2 ){ 
    var ret = [] 
        ,len = arr1.length;
    // makes a 2 element array and pushes it into the return array    
    for( x = 0; x < len; x++){ 
        ret.push( [ arr1[x], arr2[x] ] ); 
    } 
    return ret; 
}
// we need to throttle the reader
// as it can read faster than the writer can write.
reader.once('data', function( str ){ 
    util.puts('Reading...'.green) 
    headers = str; 
    reader.addListener('data', function( record ){ 
        var flushed;        flushed = streamer.write( 
            JSON.stringify( 
                hasher( zip( headers, record ) ) 
            ) + "\n" 
        )
        if( !flushed ){ 
            reader.pause(); 
        } 
    })    
    // when the streamer is empty, let the reader continus
    streamer.on('drain', function(){ 
        reader.resume(); 
    }) 
});
// when the reader is done close the 
// streamer and exit
reader.addListener('end', function( ){ 
    streamer.on('drain', function(){ 
          streamer.end(); 
          console.log("Done".red); 
    }); 
})