# tree-sitter-gxl

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for **GXL (Galaxy Flow Language)** — a domain-specific language for defining workflows, automation pipelines, and environment configurations.

## Overview

GXL organizes workflows around modules, environments, flows, and functions. This parser provides full syntax support for the language, enabling syntax highlighting, code folding, structural editing, and other editor features.

## Language Features

- **Modules** — top-level organizational units with dependency declarations
- **Environments** — configuration scopes with inheritance (`env test : dev { ... }`)
- **Flows** — pipeline definitions with before/after hooks (`flow before | @main | after { ... }`)
- **Functions** — reusable logic with default parameters (`fn deploy(*env = "dev") { ... }`)
- **Activities** — task definitions with properties like timeout and retry
- **Extern modules** — external dependencies via file path or git
- **Annotations** — metadata decorators (`#[author("John Doe")]`)
- **Built-in commands** — `gx.echo`, `gx.cmd`, `gx.tpl`, `gx.read`, `gx.assert`, `gx.ver`, `gx.read_cmd`, `gx.read_stdin`, `gx.read_file`

## Example

```gxl
#[author("John Doe")]
mod my_module : mod_a, mod_b {
    version = "1.0";

    env dev {
        root = "${HOME}/my_project";
        gx.read_cmd (
            name : "MY_PATH",
            cmd  : "pwd"
        );
    }

    env test : dev {
        root = "${HOME}/test_project";
    }

    fn deploy(*env = "dev", target) {
        gx.cmd (cmd : "deploy.sh");
        gx.echo (value : "deployed");
    }

    flow before_flow | @my_flow | after_flow {
        gx.echo (value : "Hello from my_flow");
    }

    flow reference_flow : my_flow, other_flow;
};

extern mod mod_a { path = "@{PATH}"; };
extern mod mod_b {
    git = "https://github.com/example/repo.git",
    channel = "main";
};
```

## Usage

### Rust

Add to your `Cargo.toml`:

```toml
[dependencies]
tree-sitter = ">=0.22.6"
tree-sitter-gxl = "0.0.1"
```

```rust
let language = tree_sitter_gxl::language();
let mut parser = tree_sitter::Parser::new();
parser.set_language(&language).unwrap();

let source = r#"mod example { version = "1.0"; };"#;
let tree = parser.parse(source, None).unwrap();
println!("{}", tree.root_node().to_sexp());
```

### Node.js

```javascript
const Parser = require("tree-sitter");
const GXL = require("tree-sitter-gxl");

const parser = new Parser();
parser.setLanguage(GXL);

const tree = parser.parse('mod example { version = "1.0"; };');
console.log(tree.rootNode.toString());
```

### WASM

A pre-compiled `tree-sitter-gxl.wasm` is included for browser-based usage with [tree-sitter on the web](https://github.com/nicolo-ribaudo/tree-sitter-wasm-bindings).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (for `tree-sitter-cli`)
- [Rust toolchain](https://rustup.rs/) (for building the Rust binding)

### Building

```bash
# Install dependencies
npm install

# Generate the parser from grammar.js
npx tree-sitter generate

# Run tests
npx tree-sitter test

# Build the Rust binding
cargo build

# Run Rust tests
cargo test
```

### Project Structure

```
tree-sitter-gxl/
├── grammar.js            # Grammar definition
├── queries/
│   └── highlights.scm    # Syntax highlighting queries
├── bindings/
│   └── rust/             # Rust language binding
├── src/
│   ├── parser.c          # Generated parser
│   ├── grammar.json      # Generated grammar schema
│   └── node-types.json   # AST node type definitions
├── examples/
│   └── test.gxl          # Example GXL source
├── Cargo.toml            # Rust package manifest
├── package.json          # Node.js package manifest
└── tree-sitter.json      # Tree-sitter configuration
```

## Editor Support

### Zed

The `queries/highlights.scm` file provides syntax highlighting for the [Zed editor](https://zed.dev/). See the companion Zed extension for integration.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
