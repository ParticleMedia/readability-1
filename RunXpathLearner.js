var ContentMatchUtility = require("./ContentMatchUtil");
var XpathUtil = require("./XpathUtil");
var XpathLearner = require("./XpathLearner");


async function processLineByLine(in_file_name, out_file_name, processor) {
    const in_stream = fs.createReadStream(file_name);
    const out_stream = fs.createWriteStream(out_file_name);

    const rl = readline.createInterface({input: in_stream, crlfDelay: Infinity});
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        line = await processor(line);
        out_stream.write(line + "\n");
    }
    in_stream.end();
    out_stream.end();
}

async function processOneInstance(oneline) {
    var items = oneline.split("\t");
    var url = items[1];
    var texts = []
    for(var i = 2; i<items.length; i++) {
        var text = items[i].trim();
        if(text.length == 0) {
            continue;
        }
        texts.push(text)
    }
    var text_nodes = [];
    var matched_nodes = [];
    var nonmatched_nodes = [];
    await ContentMatchUtility.get_text_node_labels(url, texts, text_nodes, matched_nodes, nonmatched_nodes);
    var rules = XpathLearner.global.xpath_learner.rule_discovery(text_nodes, matched_nodes, nonmatched_nodes);
    var s = JSON.stringify(rules);
    return s;
}

in_file_name = "./in.txt";
out_file_name = "./out.txt";
processLineByLine(in_file_name, out_file_name, processOneInstance).then(() => {
    console.log('succ');
 });
