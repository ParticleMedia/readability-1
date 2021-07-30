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
    console.log(oneline);
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
    if(match) {
        response_line += "content being matched\n";
        return response_line;
    }
    else {
        response_line += "content not matched\n";
    }
    var text_nodes_s = "";
    for(var i=0; i<text_nodes.length; i++) {
        if(i>0) {
            text_nodes_s += " ";
        }
        text_nodes_s += text_nodes[i].textContent.trim();
    }
    for(var i=0; i<texts.length; i++) {
        var index = ContentMatchUtil.str_find(text_nodes_s, texts[i]);
        if(index < 0) {
            response_line += "text not found: ";
        }
        else {
            response_line += "text found: ";
        }
        response_line += texts[i] + "\n";
    }
    if(text_nodes.length == matched_nodes.length + nonmatched_nodes.length) {
        response_line += "node size match\n";
    }
    else {
        response_line += "node size dose not match\n";
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
        var found = false;
        for(var j=0; j<texts.length; j++) {
            var offset = ContentMatchUtil.str_find(texts[j], node.textContent.trim());
            if(offset>=0) {
                found = true;
                break;
            }
        }
        if(found) {
            response_line += "found in content\t";
        }
        else {
            response_line += "not found in content\t";
        }
        response_line += node.textContent.trim() + "\n";
    }
    return response_line;
}

in_file_name = "./python_tools/test.txt";
out_file_name = "./python_tools/out.txt";
test_content_match(in_file_name, out_file_name);
