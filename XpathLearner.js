var XpathUtil = require("./XpathUtil");
var CommonUtil = require("./CommonUtil");
var RuleToXpath = require('./RuleToXpath');

/**
 * Public constructor.
 * @param {Object}       options The options object.
 */
function XpathLearner(options) {
    this.max_depth = options.max_depth;
    this.max_breadth = options.max_breadth;
    this.max_attributes_per_pattern = options.max_attributes_per_pattern;
    this.id_class_attributes_only = options.id_class_attributes_only
}

XpathLearner.prototype = {

  _add_pattern: function(pattern_dict, pattern, node_level) {
    var assoiated_nodes = pattern_dict[pattern];
    if(assoiated_nodes==null) {
        pattern_dict[pattern] = [];
        assoiated_nodes = pattern_dict[pattern];
    }
    else {
        for(var i=0; i<assoiated_nodes.length; i++) {
            if(assoiated_nodes[i][0] == node_level[0]) {
                if(assoiated_nodes[i][1] < node_level[1]) {
                    assoiated_nodes[i][1] = node_level[1];
                }
                return;
            }
        }
    }
    assoiated_nodes.push(node_level);
  },

   /**
   * Iterates over a NodeList, calls `filterFn` for each node and removes node
   * if function returned `true`.
   *
   * If function is not passed, removes all the nodes in node list.
   *
   * @param nodes a array of nodes
   * @param node_xpaths a 2D array for a list of xpath list (here one xpath list correponds to a node and its ancestors' xpath)
   * @return dict {tag + "\t" + attribute_name + "=" + attribute_value...: node list}
   */
  _build_tag_attribute_dict: function(nodes, node_xpaths) {
    pattern_dict = {};
    for(var i = 0; i < node_xpaths.length; i++) {
        var node = nodes[i];
        var xpaths = node_xpaths[i];
        for(var j=0; j<xpaths.length; j++) {
            var xpath = xpaths[j];
            var tag = xpath["nodeName"];
            var attribute_strings = [];
            for(var k=0; k<xpath.attributes.length; k++) {
                var attribute = xpath.attributes[k];
                var key = attribute[0];
                var value = attribute[1];
                if(this.id_class_attributes_only) {
                    if(key.toLowerCase() != "id" && key.toLowerCase() != "class") {
                        continue;
                    }
                }
                if(key.toLowerCase() == "href") {
                    continue;
                }
                attribute_strings.push(key + "=\"" + value + "\"");
            }
            CommonUtil.expand_string_array(attribute_strings, this.max_attributes_per_pattern);
            this._add_pattern(pattern_dict, tag, [node, j]);
            for(var k=0; k<attribute_strings.length; k++) {
                var pattern = tag + "\t" + attribute_strings[k];
                this._add_pattern(pattern_dict, pattern, [node, j]);
            }
        }
    }
    return pattern_dict;
  },

  /*
   * @param pattern_dict is a dict from pattern to node list
   * @param positive_nodes set of nodes
   * @param negative_nodes set of nodes
   * @return list of patterns
   */
  _rule_discovery: function(pattern_dict, positive_nodes, negative_nodes, depth, breadth) {
    if(depth > this.max_depth || breadth > this.max_breadth) {
        return null;
    }
    if(positive_nodes.size == 0) {
        return null;
    }
    var pr_dict = {}
    for(var pattern in pattern_dict) {
        pr_dict[pattern] = [0.0, 0.0]
        nodes = pattern_dict[pattern];
        for(var i=0; i<nodes.length; i++) {
            node = nodes[i][0];
            if(positive_nodes.has(node)) {
                pr_dict[pattern][0] += 1.0;
            }
            else if(negative_nodes.has(node)) {
                pr_dict[pattern][1] += 1.0;
            }
        }
    }
    var max_p_count = 0.0;
    var best_negative_count = 0.0;
    var highest_precision = 0.0;
    var best_pattern = null;
    for(var pattern in pattern_dict) {
        var p_count = pr_dict[pattern][0];
        if(p_count == 0) {
            continue;
        }
        var n_count = pr_dict[pattern][1];
        if(n_count == negative_nodes.size) {
            continue;
        }
        var precision = p_count / (p_count + n_count);
        if((p_count >= max_p_count && precision > highest_precision) 
            || (p_count > max_p_count && precision >= highest_precision)) {
            max_p_count = p_count;
            highest_precision = precision;
            best_pattern = pattern;
            best_negative_count = n_count;
        }
    }
    if(best_pattern == null) {
        return null;
    }
    if(max_p_count==positive_nodes.size && highest_precision == 1.0) {
        return {"branch_0": {"if": best_pattern, "next": null},
                "branch_1": null, 
                "p_count": max_p_count, "n_count": best_negative_count,
                "p_count_expected": positive_nodes.size,
                "false negative": [],
                "false positive": []
            };
    }
    var covering_positive = new Set();
    var missing_positive = new Set();
    var causing_negative = new Set();
    var node_levels = pattern_dict[best_pattern];
    var nodes = new Set();
    for(var node_level of node_levels) {
        nodes.add(node_level[0]);
    }
    var fp_0 = [];
    var fn_0 = [];
    for(var node of positive_nodes) {
        if(!nodes.has(node)) {
            missing_positive.add(node);
            fn_0.push(node.textContent);
        }
    }
    for(var node of nodes) {
        if(positive_nodes.has(node)) {
            covering_positive.add(node);
        }
        if(negative_nodes.has(node)) {
            causing_negative.add(node);
            fp_0.push(node.textContent);
        }
    }
    var pattern_0 = null;
    var pattern_1 = null;
    var fp_next = []
    var fn_next = []
    if(causing_negative.size > 0) {
        pattern_0 = this._rule_discovery(pattern_dict, covering_positive, causing_negative, depth + 1, breadth);
        if(pattern_0 != null) {
            max_p_count = pattern_0["p_count"];
            best_negative_count = pattern_0["n_count"];
            fn_next = pattern_0['false negative'];
            fp_next = pattern_0['false positive'];
        }
    }
    var fp_else = []
    var fn_else = []
    if(missing_positive.size > 0) {
        pattern_1 = this._rule_discovery(pattern_dict, missing_positive, negative_nodes, depth, breadth + 1);
        if(pattern_1 != null) {
            max_p_count += pattern_1["p_count"];
            best_negative_count += pattern_1["n_count"];
            fn_else = pattern_1['false negative'];
            fp_else = pattern_1['false positive'];
        }
    }
    var fp = []
    var fn = []
    if(pattern_0 == null) {
        if(pattern_1 != null) {
            fp = Array.from(new Set([].concat(fp_0, fp_else)));
            fn = fn_else;
        }
        else {
            fp = fp_0;
            fn = fn_0;
        }
    }
    else {
        if(pattern_1 != null) {
            fp = Array.from(new Set([].concat(fp_next, fp_else)));
            fn = [].concat(fn_next, fn_else);
        }
        else {
            fp = fp_next;
            fn = [].concat(fn_0, fn_next);
        }
    }
    var f1_old = positive_nodes.size / (positive_nodes.size + negative_nodes.size);
    var r_new = max_p_count / positive_nodes.size;
    var p_new = max_p_count / (max_p_count + best_negative_count);
    var f1_new = 2 * r_new * p_new / (r_new + p_new);
    if(f1_old > f1_new) {
        return null;
    }
    return {"branch_0": {"if": best_pattern, "next": pattern_0, 
                         "false negative": fn_next, "false_positive": fp_next}, 
            "branch_1": pattern_1, 
            "p_count": max_p_count, "n_count": best_negative_count,
            "p_count_expected": positive_nodes.size,
            "false negative": fn,
            "false positive": fp};
  },

  rule_discovery: function(text_nodes, matched_nodes, nonmatched_nodes) {
    node_xpaths = []
    for(var i=0; i<text_nodes.length; i++) {
        var xpaths = XpathUtil.node_to_xpaths_recursive(text_nodes[i]);
        node_xpaths.push(xpaths);
    }
    var tag_attribute_dict = this._build_tag_attribute_dict(text_nodes, node_xpaths);
    var rules = this._rule_discovery(tag_attribute_dict, matched_nodes, nonmatched_nodes, 0, 0);
    var xpath = RuleToXpath.pattern_to_xpaths(rules, tag_attribute_dict, matched_nodes);
    rules["xpath"] = xpath;
    return rules;
  }
}


global.xpath_learner = new XpathLearner({"max_depth": 8, "max_breadth": 16, "max_attributes_per_pattern": 3, "id_class_attributes_only": false});

module.exports.xpath_learner = global.xpath_learner;
