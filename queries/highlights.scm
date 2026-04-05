; GXL highlighting aligned with current flow/env/extern syntax.

; Lowest priority
(identifier) @variable
(var_ref) @variable

; Keywords
[
  "mod"
  "env"
  "flow"
  "fn"
  "activity"
  "extern"
  "if"
  "else"
  "for"
  "in"
] @keyword

"@" @keyword

; Builtins / constants
(builtin_name) @function.builtin
(boolean) @constant.builtin

; Operators and punctuation
[
  "="
  "|"
  ":"
  "*"
  "=="
  "!="
  ">="
  "<="
  ">"
  "<"
  "&&"
  "||"
  "!"
  "=*"
] @operator

["(" ")" "{" "}" "[" "]"] @punctuation.bracket
"#[" @punctuation.special
["," ";"] @punctuation.delimiter

; Comments / literals
(comment) @comment
(string) @string
(number) @number

; Annotations
(annotation_item
  name: (identifier) @attribute)

(annotation_arg
  key: (identifier) @attribute)

; Module / environment / flow names
(module
  name: (identifier) @type.definition)

(environment
  name: (identifier) @type.definition)

(activity
  name: (identifier) @type.definition)

(function_def
  name: (identifier) @function.definition)

(function_param
  name: (identifier) @variable.parameter)

(flow_head_at
  name: (identifier) @function.definition)

(flow_head_colon
  name: (identifier) @function.definition)

(flow_head_pipe
  name: (identifier) @function.definition)

(flow_ref
  (identifier) @function)

(flow_ref
  (dotted_name) @function)

; Extern modules / keys
(extern_module
  (identifier) @type)

(extern_source_entry
  key: (extern_key) @keyword)

; Calls
(call_expression
  target: (identifier) @function)

(call_expression
  target: (dotted_name) @function)

(condition_call
  target: (identifier) @function)

; Props / args
(property
  key: (identifier) @property)

(command_prop
  key: (identifier) @property)

(object_item
  key: (identifier) @property)
