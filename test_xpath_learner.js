var FileUtil = require("./FileUtil");
var ContentMatchUtil = require("./ContentMatchUtil");
var XpathLearner = require("./XpathLearner");
var fs = require("fs");
var readline = require('readline');
var RunXpathLearner = require('./RunXpathLearner');
const { assert } = require("console");

var total = 0;
var correct = 0;
var f1_list = [];

function test_xpath_learner(in_file_name, out_file_name) {
    FileUtil.processLineByLine(in_file_name, out_file_name, _learn_xpath).then(() => {
        console.log('test_xpath_learner done!');
     }); 
}


async function _learn_xpath(oneline) {
    var items = oneline.split("\t");
    console.log(items[0] + "\t" + items[1]);
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
    total += 1;
    var rules = await XpathLearner.xpath_learner.rule_discovery(text_nodes, 
                                                                new Set(matched_nodes), 
                                                                new Set(nonmatched_nodes));
    if(rules["false positive"].length + rules["false negative"].length == 0) {
        correct += 1;
    }
    var p = rules['p_count'] / (rules['p_count'] + rules['n_count'])
    var c = rules['p_count'] / matched_nodes.length;
    var f1 = 2 * p * c /(p + c);
    f1_list += " " + f1.toString();
    console.log(correct);
    console.log(total);
    console.log(f1_list);
    var s = JSON.stringify(rules);
    console.log(s);
    return s;
}

in_file_name = "./python_tools/test.txt";
out_file_name = "./python_tools/out_rules.txt";
test_xpath_learner(in_file_name, out_file_name);
