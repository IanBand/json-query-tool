#!/usr/bin/env node

/* TODO: support .operator and [] accessor within keys
  similar to how resolvePath works
*/

const fs = require('fs');
const path = require('path');
var beautify = require('json-beautify');
const argv = require('yargs')
  .command('ep [path]', 'Entry Point; recursively search for json files starting in [path]\n', (y) => {
		y
		.positional('path', {
			describe: 'path of folder to search',
			default: '.'
    })}
  )
  .command('fr [pattern]', 'Filename Regex; apply operations only to json files that match [regex]\n', (y) => {
		y
		.positional('pattern', {
			describe: 'regular expression for determining which files to operate on',
			default: '.*'
    })}
  ) 
  .command('akv [key] [val]', 'Adds a Key Value pair to the json\n', (y) => {
		y
		.positional('key', {
			describe: 'the key that will be added',
			default: '__UNSPECIFIED_KEY__'
    })
    .positional('val', {
			describe: 'the value that will be added',
			default: '__UNSPECIFIED_VAL__'
    })}
  )
  .command('rk [key]', 'Remove Key; removes the key value pair with a matching [key]\n', (y) => {
		y
		.positional('key', {
			describe: 'the key to be removed (the value is also lost)',
			default: '__UNSPECIFIED_KEY__'
    })}
  )
  .command('ckn [key]', 'Change Key Name; changes the key of a key value pair with a matching [key], and preserves the value\n', (y) => {
		y
		.positional('key', {
			describe: `the key to be modified (the key's value is preserved)`,
			default: '__UNSPECIFIED_KEY__'
    })}
  )
  .command('uve [key] [matchingVal] [newVal]', `Update Value if Equal; replaces the value in [key] with [newVal] if the key's value matches [matchingVal]\n`, (y) => {
    y
    .positional('key', {
			describe: 'the key that will be operated on',
			default: '__UNSPECIFIED_KEY__'
    })
    .positional('matchingVal', {
			describe: 'the value that must be matched',
			default: '__UNSPECIFIED_VAL__'
    })
		.positional('newVal', {
			describe: 'the updated value',
			default: '__UNSPECIFIED_VAL__'
    })}
  ) 
  .command('akl [key] [measureKey]', `Add Key Length; adds a [key] with the value [measureKey].length\n`, (y) => {
    y
    .positional('key', {
			describe: 'the key that will be added',
			default: '__UNSPECIFIED_KEY__'
    })
    .positional('measureKey', {
			describe: `the key who's value's length will be the value of [key]`,
			default: '__UNSPECIFIED_VAL__'
    })}
  ) 
  .command('tn [key]', 'convert key To Number; converts the value in [key] to a number, if applicable\n', (y) => {
		y
		.positional('key', {
			describe: 'the key that will be operated on',
			default: '__UNSPECIFIED_KEY__'
    })}
  )
  .command('ts [key]', 'convert key To String; converts the value in [key] to a string, if applicable. Does not work on null and undefined values', (y) => {
		y
		.positional('key', {
			describe: 'the key that will be operated on',
			default: '__UNSPECIFIED_KEY__'
    })}
  )
  .argv;

//console.log(argv);

// TODO: there is probably a proper way to do this with yargs
if(!argv.path) argv.path = '.';

if(!argv.pattern) argv.pattern = '.*';
else console.log("only modifying files that match: ", argv.pattern);
var pattern = new RegExp(argv.pattern);

// https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
// walk() written by stackoverflow users chjj and wyattis
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if(path.basename(dir) == 'node_modules') return done(null, results); // never accidentially search a node_modules folder
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if(
            path.extname(file).toLowerCase() === '.json' &&   // check that it's a json file
            pattern.test(path.basename(file, '.json'))   &&   // check that the regex matches
            path.basename(file, '.json') != 'package'         // dont modify files called package.json
            ){ 
              results.push(file);
            }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk(argv.path, (walkErr, files) => {
  var total = 0;
  files.forEach((file => {
    // open file, parse JSON
    fs.readFile(file, 'utf8', (readErr, data) => {
      if(readErr){
        console.error(readErr);
        return;
      }

      var jsonObj = JSON.parse(data);

      // apply operation
      if(argv._.includes('akv')){
        jsonObj[argv.key] = argv.val;
      }
      else if(argv._.includes('akl')){
        //check that measureKey exists
        if(jsonObj[argv.measureKey] !== undefined){
          jsonObj[argv.key] = jsonObj[argv.measureKey].length;
        }
      }
      else if(jsonObj[argv.key] === undefined){
        //make sure the key exists in the json before operating on it
        return;
      }
      else if(argv._.includes('rk')){
        delete jsonObj[argv.key];
      }
      else if(argv._.includes('uve')){ //probably bugs out when the json or args are NaN
        // preserve original number type
        if(jsonObj[argv.key] === Number(argv.matchingVal)){
          jsonObj[argv.key] = Number(argv.newVal);
        }
        else if(jsonObj[argv.key] === argv.matchingVal){
          jsonObj[argv.key] = argv.newVal;
        }
      }
      else if(argv._.includes('tn')){
        if(Number(jsonObj[argv.key]) != NaN ){
          jsonObj[argv.key] = Number(jsonObj[argv.key]);
        }
      }
      else if(argv._.includes('ts')){
        jsonObj[argv.key] = String(jsonObj[argv.key]);
      }
      //console.log(beautify(jsonObj, null, 2, 100));
      fs.writeFile(file, beautify(jsonObj, null, 2, 100), 'utf8', (writeErr) => {
        if(writeErr) console.error(writeErr);
        else{
          //console.log('updated ', file);
          total++;
        }
      })
    });

    // write JSON, close file
    //fs.writeFileSync(file, JSON.stringify(jsonObj))
  }))
  //console.log('=-=-=-=-=-=-=-=-=-=-=-=');
  console.log('files searched: ', files.length);
  //console.log('files updated:  ', total);
  //console.log('=-=-=-=-=-=-=-=-=-=-=-=');
})


