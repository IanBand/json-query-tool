# Json Query Tool
A tool for batch manipulating large collections of JSON files with SQL like commands.

## Usage
**node jqt.js ep [path]**
Entry Point; recursively search for json files starting in [path]. By default JQT will search starting in its current firectory.

**node jqt.js fr [pattern]**
Filename Regex; apply operations only to json files that match [regex]. By default JQT will match all .json files excluding anything found in a /node_modules folder and anything named 'package.json'

*The following commands should only be used one at a time. They are all idempotent, meaning repeated use of the same command with the same arguments will have no effect on your data.*

**node jqt.js akv [key] [val]**  Adds a Key Value pair to the json

**node jqt.js rk [key]** Remove Key; removes the key value pair with a matching [key]

**node jqt.js uve [key] [matchingVal] [newVal]** Update Value if Equal; replaces the value in [key] with [newVal] if the key's value matches [matchingVal]

**node jqt.js akl [key] [measureKey]** Add Key Length; adds a [key] with the value [measureKey].length

**node jqt.js tn [key]** convert key To Number; converts the value in [key] to a number, if applicable.

**node jqt.js ts [key]** convert key To String; converts the value in [key] to a string, if applicable. Does not work on null and undefined values

## Options:
node jqt.js --help     Show help  
