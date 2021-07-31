var fs = require("fs");
var readline = require("readline");

async function processLineByLine(in_file_name, out_file_name, processor) {
    const in_stream = fs.createReadStream(in_file_name);
    const out_stream = fs.createWriteStream(out_file_name);

    const rl = readline.createInterface({input: in_stream, crlfDelay: Infinity});
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        var out_line = await processor(line);
        await out_stream.write(line + "\n" + out_line + "\n\n");
    }
    in_stream.close();
    out_stream.end();
}

module.exports.processLineByLine = processLineByLine;
