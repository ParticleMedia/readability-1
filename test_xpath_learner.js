var FileUtil = require("./FileUtil");
var ContentMatchUtil = require("./ContentMatchUtil");
var XpathUtil = require("./XpathUtil");
var XpathLearner = require("./XpathLearner");
var fs = require("fs");
var readline = require('readline');
var RunXpathLearner = require('./RunXpathLearner');
const { assert } = require("console");


function test_content_match(in_file_name, out_file_name) {
    FileUtil.processLineByLine(in_file_name, out_file_name, _content_match_line).then(() => {
        console.log('test_content_match done!');
     }); 
}

async function _content_match_line(oneline) {
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
    var match = await ContentMatchUtil.get_text_node_labels(url, texts, text_nodes, matched_nodes, nonmatched_nodes);
    var response_line = "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n";
    response_line += url + "\n";
    for(var i=0; i<texts.length; i++) {
        response_line += texts[i] + "\n";
    }
    if(match) {
        response_line += "being matched\n";
    }
    else {
        response_line += "not matched\n";
    }
    if(text_nodes.length == matched_nodes.length + nonmatched_nodes.length) {
        response_line += "size match\n";
    }
    else {
        response_line += "size dose not match\n";
    }
    var match_set = new Set(matched_nodes);
    for(var i=0; i<text_nodes.length; i++) {
        var node = text_nodes[i];
        if(node.textContent == null || node.textContent.trim().length == 0) {
            continue;
        }
        if(match_set.has(node)) {
            response_line += "node " + i.toString() + " is matched\t";
        }
        else {
            response_line += "node " + i.toString() + " not matched\t";
        }
        response_line += node.textContent.trim() + "\n";
    }
    return response_line;
}

in_file_name = "./python_tools/test.txt";
out_file_name = "./python_tools/out.txt";
test_content_match(in_file_name, out_file_name);
