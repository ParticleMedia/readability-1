var FileUtil = require("./FileUtil");
var ContentMatchUtil = require("./ContentMatchUtil");
var XpathLearner = require("./XpathLearner");
var fs = require("fs");
var readline = require('readline');
var RunXpathLearner = require('./RunXpathLearner');
const { assert } = require("console");


function test_xpath_learner(in_file_name, out_file_name) {
    FileUtil.processLineByLine(in_file_name, out_file_name, _learn_xpath).then(() => {
        console.log('test_xpath_learner done!');
     }); 
}

async function _learn_xpath(oneline) {
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
    if(!match) {
        return "content does not match!";
    }
    var rules = await XpathLearner.xpath_learner.rule_discovery(text_nodes, matched_nodes, nonmatched_nodes);
    var s = JSON.stringify(rules);
    return s;
}

in_file_name = "./python_tools/enus_content_list.txt";
out_file_name = "./python_tools/out_rules.txt";
test_xpath_learner(in_file_name, out_file_name);
