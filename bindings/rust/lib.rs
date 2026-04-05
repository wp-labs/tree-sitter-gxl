//! This crate provides GXL (Galaxy Flow Language) support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [language][language func] function to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! let code = r#"
//! "#;
//! let mut parser = tree_sitter::Parser::new();
//! parser.set_language(&tree_sitter_gxl::language()).expect("Error loading Gxl grammar");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! ```
//!
//! [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
//! [language func]: fn.language.html
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter::Language;

extern "C" {
    fn tree_sitter_gxl() -> Language;
}

/// Get the tree-sitter [Language][] for this grammar.
///
/// [Language]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Language.html
pub fn language() -> Language {
    unsafe { tree_sitter_gxl() }
}

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    fn parse_ok(code: &str) {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::language())
            .expect("Error loading Gxl grammar");
        let tree = parser
            .parse(code, None)
            .expect("parse should return a tree");
        assert!(
            !tree.root_node().has_error(),
            "unexpected parse error: {}",
            tree.root_node().to_sexp()
        );
    }

    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::language())
            .expect("Error loading Gxl grammar");
    }

    #[test]
    fn parses_current_flow_heads_and_builtins() {
        parse_ok(
            r#"
extern mod ops { git = "https://github.com/example/ops-mods.git", branch = "main"; }

mod main {
  env prod : base;

  #[transaction, undo(rollback)]
  flow @release | render | patch | deploy;

  flow render { gx.tpl(tpl: "./tpls", dst: "./out", file: "./values.json"); }
  flow patch { gx.patch_file(file: "./nginx.conf", action: "set", marker: "upstream", value: "\"api_upstream\""); }
  flow deploy { ops.deploy(env: "prod"); }
  flow rollback { gx.shell(shell: "./rollback.sh"); }
}
"#,
        );
    }

    #[test]
    fn parses_branch_tag_if_for_and_colon_flow() {
        parse_ok(
            r#"
extern mod base { git = "https://github.com/example/base.git", tag = "v1.0.0"; }

mod main {
  env default {}

  flow test : pre1,pre2 : post1,post2 {
    if defined(${CUR.ENABLE}) && ${CUR.ENABLE} == true {
      gx.echo(value: "enabled");
    } else {
      gx.echo(value: "disabled");
    }

    for ${CUR} in ${DATA} {
      gx.shell(shell: "./run.sh ${CUR}");
    }
  }
}
"#,
        );
    }

    #[test]
    fn parses_repo_example_without_errors() {
        parse_ok(include_str!("../../examples/test.gxl"));
    }
}
