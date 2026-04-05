/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "gxl",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) => choice($.module, $.extern_module),

    comment: (_$) => token(/#([^\[\n][^\n]*)?/),

    annotation: ($) => seq("#[", commaSep1($.annotation_item), "]"),

    annotation_item: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("(", optional(commaSep1($.annotation_arg)), ")")),
      ),

    annotation_arg: ($) =>
      choice(
        seq(
          field("key", $.identifier),
          choice("=", ":"),
          field("value", $._value),
        ),
        $._value,
      ),

    extern_module: ($) =>
      seq(
        "extern",
        "mod",
        commaSep1(field("name", $.identifier)),
        "{",
        repeat($.extern_source_entry),
        "}",
        optional(";"),
      ),

    extern_source_entry: ($) =>
      seq(field("key", $.extern_key), "=", field("value", $.string), choice(",", ";")),

    extern_key: (_$) => choice("path", "git", "branch", "channel", "tag"),

    module: ($) =>
      seq(
        repeat($.annotation),
        "mod",
        field("name", $.identifier),
        optional(seq(":", $.mix_list)),
        "{",
        repeat($._module_item),
        "}",
        optional(";"),
      ),

    mix_list: ($) => commaSep1(choice($.identifier, $.var_ref)),

    _module_item: ($) =>
      choice(
        $.property,
        $.environment,
        $.flow_definition,
        $.function_def,
        $.activity,
      ),

    property: ($) =>
      seq(field("key", $.identifier), "=", field("value", $._value), choice(",", ";")),

    environment: ($) =>
      seq(
        repeat($.annotation),
        "env",
        field("name", $.identifier),
        optional(seq(":", $.mix_list)),
        choice(";", seq("{", repeat($._env_item), "}", optional(";"))),
      ),

    _env_item: ($) => choice($.property, $.gx_vars_block, $.command_stmt, $.if_stmt, $.for_stmt),

    gx_vars_block: ($) =>
      seq(
        "gx.vars",
        "{",
        optional(choice($.command_args, repeat1($.property))),
        "}",
        optional(";"),
      ),

    flow_definition: ($) =>
      seq(
        repeat($.annotation),
        "flow",
        field("head", $.flow_head),
        choice(";", seq("{", repeat($._block_item), "}", optional(";"))),
      ),

    flow_head: ($) => choice($.flow_head_at, $.flow_head_colon, $.flow_head_pipe),

    flow_head_at: ($) =>
      prec(
        3,
        seq(
          "@",
          field("name", $.identifier),
          optional(seq("|", field("after", $.flow_pipe))),
        ),
      ),

    flow_head_colon: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("before", $.flow_list),
        optional(seq(":", field("after", $.flow_list))),
      ),

    flow_head_pipe: ($) =>
      prec.right(
        1,
        seq(field("name", $.identifier), optional(seq("|", field("after", $.flow_pipe)))),
      ),

    flow_list: ($) => commaSep1($.flow_ref),

    flow_pipe: ($) => prec.right(pipeSep1($.flow_ref)),

    flow_ref: ($) => choice($.dotted_name, $.identifier, $.var_ref),

    _block_item: ($) => choice($.property, $.if_stmt, $.for_stmt, $.command_stmt),

    if_stmt: ($) =>
      seq(
        "if",
        field("condition", $.condition_expr),
        field("body", $.block),
        repeat(seq("else", "if", field("elseif", $.condition_expr), field("elseif_body", $.block))),
        optional(seq("else", field("else_body", $.block))),
      ),

    for_stmt: ($) =>
      seq(
        "for",
        field("item", $.var_ref),
        "in",
        field("iterable", choice($.var_ref, $.dotted_name, $.identifier)),
        field("body", $.block),
      ),

    block: ($) => seq("{", repeat($._block_item), "}"),

    condition_expr: ($) =>
      prec.right(
        repeat1(
          choice(
            $.condition_call,
            $.var_ref,
            $.dotted_name,
            $.identifier,
            $.string,
            $.number,
            $.boolean,
            "==",
            "!=",
            ">=",
            "<=",
            ">",
            "<",
            "&&",
            "||",
            "!",
            "=*",
            "(",
            ")",
          ),
        ),
      ),

    condition_call: ($) =>
      prec(1, seq(field("target", $.identifier), "(", optional(commaSep1($._value)), ")")),

    function_def: ($) =>
      seq(
        repeat($.annotation),
        "fn",
        field("name", $.identifier),
        "(",
        optional($.function_params),
        ")",
        "{",
        repeat($._block_item),
        "}",
        optional(";"),
      ),

    function_params: ($) => commaSep1($.function_param),

    function_param: ($) =>
      seq(
        optional("*"),
        field("name", $.identifier),
        optional(seq("=", field("default", $._value))),
      ),

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

    command_stmt: ($) => seq(choice($.builtin_command, $.call_expression), optional(";")),

    builtin_command: ($) =>
      seq(field("name", $.builtin_name), "(", optional($.command_args), ")"),

    builtin_name: (_$) =>
      token(
        choice(
          "gx.echo",
          "gx.vars",
          "gx.cmd",
          "gx.shell",
          "gx.run",
          "gx.read",
          "gx.read_cmd",
          "gx.read_stdin",
          "gx.read_file",
          "gx.tpl",
          "gx.assert",
          "gx.ver",
          "gx.tar",
          "gx.untar",
          "gx.download",
          "gx.upload",
          "gx.patch_file",
        ),
      ),

    call_expression: ($) =>
      seq(field("target", choice($.dotted_name, $.identifier)), "(", optional($.command_args), ")"),

    dotted_name: ($) => seq($.identifier, repeat1(seq(".", $.identifier))),

    command_args: ($) => commaSep1(choice($.command_prop, $._value)),

    command_prop: ($) => seq(field("key", $.identifier), ":", field("value", $._value)),

    list: ($) => seq("[", optional(commaSep1($._value)), "]"),

    object: ($) => seq("{", optional(commaSep1($.object_item)), "}"),

    object_item: ($) => seq(field("key", $.identifier), ":", field("value", $._value)),

    _value: ($) =>
      choice(
        $.var_ref,
        $.string,
        $.number,
        $.boolean,
        $.dotted_name,
        $.identifier,
        $.list,
        $.object,
      ),

    var_ref: (_$) => token(seq("${", /[^}\n]+/, "}")),

    string: (_$) => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    number: (_$) => /\d+(\.\d+)?/,

    boolean: (_$) => choice("true", "false"),

    identifier: (_$) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function pipeSep1(rule) {
  return seq(rule, repeat(seq("|", rule)));
}
