/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "gxl",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) => choice($.module, $.extern_module),

    // ── Comments ──
    // # line comment (but NOT #[ which starts an annotation)
    comment: (_$) => token(/#([^\[\n][^\n]*)?/),

    // ── Annotations ──
    annotation: ($) =>
      seq(
        "#[",
        field("name", $.identifier),
        optional(seq("(", commaSep1($.annotation_arg), ")")),
        "]",
      ),

    annotation_arg: ($) =>
      choice(
        seq(field("key", $.identifier), "=", field("value", $.string)),
        $.string,
      ),

    // ── Extern module ──
    extern_module: ($) =>
      seq(
        "extern",
        "mod",
        commaSep1(field("name", $.identifier)),
        "{",
        choice($.path_source, $.git_source),
        "}",
        optional(";"),
      ),

    path_source: ($) => seq("path", "=", $.string, ";"),

    git_source: ($) =>
      seq("git", "=", $.string, ",", "channel", "=", $.string, ";"),

    // ── Module ──
    module: ($) =>
      seq(
        repeat($.annotation),
        "mod",
        field("name", $.identifier),
        optional(seq(":", $.ref_list)),
        "{",
        repeat($._module_item),
        "}",
        optional(";"),
      ),

    ref_list: ($) => commaSep1($.identifier),

    _module_item: ($) =>
      choice(
        $.property,
        $.environment,
        $.flow_definition,
        $.flow_reference,
        $.function_def,
        $.activity,
      ),

    // ── Property ──
    property: ($) =>
      seq(
        field("key", $.identifier),
        "=",
        field("value", choice($.string, $.number)),
        ";",
      ),

    // ── Environment ──
    environment: ($) =>
      seq(
        repeat($.annotation),
        "env",
        field("name", $.identifier),
        optional(seq(":", $.ref_list)),
        "{",
        repeat($._env_item),
        "}",
        optional(";"),
      ),

    _env_item: ($) => choice($.property, $.command_stmt, $.gx_vars_block),

    gx_vars_block: ($) =>
      seq("gx.vars", "{", optional($.command_props), "}"),

    // ── Flow ──
    flow_definition: ($) =>
      seq(
        repeat($.annotation),
        "flow",
        optional(seq($.ref_list, "|")),
        "@",
        field("name", $.identifier),
        optional(seq("|", $.ref_list)),
        "{",
        repeat($._flow_item),
        "}",
        optional(";"),
      ),

    flow_reference: ($) =>
      seq(
        repeat($.annotation),
        "flow",
        field("name", $.identifier),
        ":",
        $.ref_list,
        ";",
      ),

    _flow_item: ($) => choice($.command_stmt, $.property),

    // ── Function ──
    function_def: ($) =>
      seq(
        repeat($.annotation),
        "fn",
        field("name", $.identifier),
        "(",
        optional($.function_params),
        ")",
        "{",
        repeat($.command_stmt),
        "}",
        optional(";"),
      ),

    function_params: ($) => commaSep1($.function_param),

    function_param: ($) =>
      seq(
        optional("*"),
        field("name", $.identifier),
        optional(seq("=", field("default", $.string))),
      ),

    // ── Activity ──
    activity: ($) =>
      seq(
        repeat($.annotation),
        "activity",
        field("name", $.identifier),
        "{",
        repeat($.property),
        "}",
        optional(";"),
      ),

    // ── Commands ──
    command_stmt: ($) =>
      seq(choice($.builtin_command, $.call_expression), ";"),

    builtin_command: ($) =>
      seq(
        field("name", $.builtin_name),
        "(",
        optional($.command_props),
        ")",
      ),

    builtin_name: (_$) =>
      token(
        choice(
          "gx.echo",
          "gx.vars",
          "gx.cmd",
          "gx.read",
          "gx.tpl",
          "gx.assert",
          "gx.ver",
          "gx.read_cmd",
          "gx.read_stdin",
          "gx.read_file",
        ),
      ),

    call_expression: ($) =>
      seq(
        field("target", choice($.dotted_name, $.identifier)),
        "(",
        optional($.command_props),
        ")",
      ),

    dotted_name: ($) => seq($.identifier, repeat1(seq(".", $.identifier))),

    command_props: ($) => commaSep1($.command_prop),

    command_prop: ($) =>
      seq(
        field("key", $.identifier),
        ":",
        field("value", choice($.string, $.identifier)),
      ),

    // ── Literals ──
    string: (_$) =>
      token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    number: (_$) => /\d+(\.\d+)?/,

    // ── Identifier ──
    identifier: (_$) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
