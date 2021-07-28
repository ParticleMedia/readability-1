var FileUtil = require("./FileUtil");
var ContentMatchUtil = require("./ContentMatchUtil");
var XpathUtil = require("./XpathUtil");
var XpathLearner = require("./XpathLearner");
var fs = require("fs");
var readline = require('readline');


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
    await ContentMatchUtil.get_text_node_labels(url, texts, text_nodes, matched_nodes, nonmatched_nodes);
    var rules = XpathLearner.xpath_learner.rule_discovery(text_nodes, matched_nodes, nonmatched_nodes);
    var s = JSON.stringify(rules);
    return s;
}
