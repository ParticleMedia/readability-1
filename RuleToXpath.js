/***
 * functions to convert learned pattern into xpath format
 */
var XpathUtil = require("./XpathUtil");

function _condition_to_xpath(cond_s) {
    parts = cond_s[0].split("\t")
    if(parts.length == 0) {
        return "";
    }
    var xpaths = "//" + parts[0];
    for(var i=1; i<parts.length; i++) {
        if(i==1) {
            xpaths += "["
        }
        else {
            xpaths += " "
        }
        var kv = parts[i].split("=");
        xpaths += "@" + kv[0] + "=" + kv[1];
        if(i==parts.length-1) {
            xpaths += "]";
        }
    }
    return xpaths;
}

function _rule_to_xpath(condtions_s) {
    var xpath = "";
    for(var i=0; i<condtions_s.length; i++) {
        xpath += _condition_to_xpath(condtions_s[i]);
    }
    return xpath;
}

function _pattern_to_rules(pattern, current_rule, all_rules) {
    for(var i=0; i<2; i++) {
        var key = "branch_" + i.toString();
        var value = pattern[key];
        if(value == null) {
            continue;
        }
        if(i==0) {
            var if_s = value["if"];
            if(if_s == null) {
                continue
            }
            var current_rule_1 = current_rule.slice()
            current_rule_1.push(if_s);
            var next = value["next"];
            if(next == null) {
                all_rules.push(current_rule_1);
            }
            else {
                _pattern_to_rules(next, current_rule_1, all_rules);
            }
        }
        else {
            _pattern_to_rules(value, current_rule, all_rules);
        }
    }
}

function _set_condition_order(all_rules, tag_attribut_dict, target_nodes, xpath_set) {
    for(var i=0; i<all_rules.length; i++) {
        for(var node of target_nodes) {
            if(_set_condition_order_one_node(all_rules[i], tag_attribut_dict, node, xpath_set)){
                continue;
            }
        }
    }
}

function _set_condition_order_one_node(rule, tag_attribut_dict, node, xpath_set) {
    var rule_with_order = [];
    for(var i=0; i<rule.length; i++) {
        var nodes = tag_attribut_dict[rule[i]];
        if(nodes == null) {
            return false;
        }
        var level = -1;
        for(var j=0; j<nodes.length; j++) {
            if(nodes[j][0] == node) {
                level = nodes[j][1];
                break;
            }
        }
        if(level < 0) {
            return false;
        }
        rule_with_order.push([rule[i], level])
    }
    rule_with_order.sort((a, b) => b[1] - a[1]);
    rule_reordered = [];
    for(var i=0; i<rule_with_order.length; i++) {
        rule_reordered.push(rule_with_order[i][0]);
    }
    xpath_s = _rule_to_xpath(rule_with_order);
    xpath_set.add(xpath_s);
}


function pattern_to_xpaths(pattern, tag_attribut_dict, target_nodes) {
    var xpath_set = new Set();
    var all_rules = [];
    _pattern_to_rules(pattern, [], all_rules)
    _set_condition_order(all_rules, tag_attribut_dict, target_nodes, xpath_set);
    var xpath_s = "";
    for(var one_xpath_s of xpath_set) {
        if(xpath_s.length > 0) {
            xpath_s += " | ";
        }
        xpath_s += one_xpath_s;
    }
    return xpath_s;
}

module.exports.pattern_to_xpaths = pattern_to_xpaths;
