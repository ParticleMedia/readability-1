const { notDeepEqual } = require('assert');
const fs = require('fs');
const got = require('got');
const readline = require('readline');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * 
 * @param {*} str_0 string, its substring to match the full str_1
 * @param {*} str_1 string
 * @param {*} offset 
 * @returns how many characteres being matched
 */
function _str_match(str_0, str_1, offset){
    str_1 = str_1.trim();
    if(str_1.length == 0) {
        return 0;
    }
    str_0 = str_0.replace(/’/g, "'").replace(/“/g, "\"").replace(/”/g, "\"").replace(/\s+/g, " ").replace(/  /g, " ");
    str_1 = str_1.replace(/’/g, "'").replace(/“/g, "\"").replace(/”/g, "\"").replace(/\s+/g, " ").replace(/  /g, " ");
    var advance = 0;
    if(str_1.length + offset > str_0.length) {
        //the match should not be across the text chunk boundaries
        return 0;
    }

    var mismatch_count = 0;
    for(var i=0; i<str_1.length; i++) {
        if(str_1[i] != str_0[offset + i]) {
            mismatch_count += 1;
        }
        advance += 1;
    }
    if(mismatch_count != 0) {
        if(mismatch_count > 2 || str_1.length < 50) {
            return 0;
        }
    }
    if(offset + advance == str_0.length) {
        return advance;
    }

    //here we removed the code to force the match ended with white spaces or delimeters to i
    //improve robustness

    //advance to the next non-white-space
    while(offset + advance < str_0.length) {
        c = str_0[offset + advance];
        if(c==" ") {
            advance += 1;
        }
        else{
            break;
        }
    }
    return advance;
}

/**
 * 
 * @param {*} nodes list of text nodes
 * @param {*} texts list of texts of article content
 * @param {*} matched_nodes list of text nodes matching some content texts
 * @param {*} unmatched_nodes list of text nodes not matching any content texts
 * @param {*} node_offset the starting node offset to match
 * @param {*} text_offset_0 the starting text offset to match
 * @param {*} text_offset_1 the starting substring offset to match
 * @returns true or false
 */
function _match_node_text_recursive(nodes, 
                          texts, 
                          matched_nodes, 
                          unmatched_nodes, 
                          node_offset,
                          text_offset_0, 
                          text_offset_1) {
    //text in texts are trimed, and length > 0
    if(text_offset_0 >= texts.length) {
        //all the texts are matched
        //put all the left nodes into unmatched
        for(var i=node_offset; i<nodes.length; i++) {
            unmatched_nodes.push(nodes[i]);
        }
        return true;
    }
    if(node_offset >= nodes.length) {
        return false;
    }
    //check substring match between the node and the text
    var advance = _str_match(texts[text_offset_0], nodes[node_offset].textContent, text_offset_1);
    if(advance == 0) {
        unmatched_nodes.push(nodes[node_offset]);
        var result = _match_node_text_recursive(nodes, texts, matched_nodes, unmatched_nodes, 
            node_offset + 1, text_offset_0, text_offset_1);
        if(result) {
            return true;
        }
        else {
            //the whole match fail; we have to backtrack
            unmatched_nodes.pop();
            return false;
        }
    }
    else {
        matched_nodes.push(nodes[node_offset]);
        //cache the current matching offsets for backtracking
        var old_text_offset_0 = text_offset_0
        var old_text_offset_1 = text_offset_1
        text_offset_1 += advance;
        
        //the current text is fully matched, let's move to the next text
        if(texts[text_offset_0].length <= text_offset_1) {
            text_offset_0 += 1;
            text_offset_1 = 0;
        }
        var result = _match_node_text_recursive(nodes, texts, matched_nodes, unmatched_nodes, 
            node_offset + 1, text_offset_0, text_offset_1);
        if(result) {
            return true;
        }
        else {
            //let's try other matching possibilities
            matched_nodes.pop();
            if(node_offset + 1 >= nodes.length) {
                //let's backtrack
                return false;
            }
            unmatched_nodes.push(nodes[node_offset]);
            var result = _match_node_text_recursive(nodes, texts, matched_nodes, unmatched_nodes, 
                node_offset + 1, old_text_offset_0, old_text_offset_1);
            if(result) {
                return true;
            }
            unmatched_nodes.pop();
            return false;
        }
    }
}

/**
 * 
 * @param {*} nodes text node list
 * @param {*} texts text content list
 * @param {*} matched_nodes nodes matching some text content
 * @param {*} unmatched_nodes nodes not matching any text content
 * @returns true if all texts can match to some text nodes. 
 *          A valid match should follow order, continuous, and bounary contraints
 */
function _match_node_text(nodes, texts, matched_nodes, unmatched_nodes) {
    if(nodes.length == 0 || texts.length == 0) {
        //no need to match
        return false;
    } 
    return _match_node_text_recursive(nodes, 
        texts, matched_nodes, unmatched_nodes,
        0, 0, 0);
}

async function _get_text_nodes(url, text_nodes) {
    var response = await got(url);
    var dom = new JSDOM(response.body);
    var node = dom.window.document;
    _get_text_nodes_recursive(node, text_nodes)
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
            if(nodes[i].textContent != null && nodes[i].textContent.trim().length > 0) {
               text_nodes.push(nodes[i]);
            }
        }
        else {
            _get_text_nodes_recursive(nodes[i], text_nodes);
        }
    }
}

async function get_text_node_labels(url, texts, text_nodes, matched_nodes, unmatched_nodes) {
    await _get_text_nodes(url, text_nodes);
    var match = _match_node_text(text_nodes, texts, matched_nodes, unmatched_nodes);
    return match;
}

module.exports.get_text_node_labels = get_text_node_labels;
