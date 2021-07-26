const { notDeepEqual } = require('assert');
const fs = require('fs');
const got = require('got');
const readline = require('readline');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


function eq(text_0, text_1) {
    test_0 = text_0.trim();
    text_1 = text_1.trim();
    return (text_0 == text_1)
}

function _match_node_text(nodes, texts, matched_nodes, unmatched_nodes) {
    var offset = 0;
    for(var i=0; i < nodes.length; i++) {
        var node = nodes[i];
        if(offset >= texts.length) {
            unmatched_nodes.push(node);
            continue;
        }
        var text = texts[offset];
        if(eq(node.textContent == text)) {
            matched_nodes.push(node);
            offset += 1;
        }
        else {
            unmatched_nodes.push(node);
        }
    }
}

async function _get_text_nodes(url) {
    var response = await got(url);
    var dom = new JSDOM(response.body);
    var node = dom.window.document;
    var text_nodes = []
    _get_text_nodes_recursive(node, text_nodes)
    return text_nodes;
}

function _get_text_nodes_recursive(node, text_nodes) {
    if(node.nodeName == null) {
        return;
    }
    var nodes = node.childNodes;
    for (var i = 0; i <nodes.length; i++){
        if(!nodes[i]){
        continue;
        }
        if(nodes[i].nodeName == "#text") {
            if(nodes[i].textContent != null && nodes[i].textContent.length > 0) {
               text_nodes.push(nodes[i]);
            }
        }
        else {
            _get_text_nodes_recursive(node, text_nodes);
        }
    }
}

async function get_text_node_labels(url, texts, text_nodes, matched_nodes, unmatched_nodes) {
    var text_nodes = _get_text_nodes(url);
    _match_node_text(text_nodes, texts, matched_nodes, unmatched_nodes);
}
