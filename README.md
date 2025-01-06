# Synstack

A collection of packages for fast iterations on LLM scripts, workflows, and applications

## Packages

### Bundle Package

- [@synstack/synscript](./packages/synscript/README.md) - The one for all package, includes bundled exports from all other packages (recommended)

### Individual Packages

#### AI/LLM

- [@synstack/llm](./packages/llm/README.md) - Immutable, chainable, and type-safe wrapper of Vercel's AI SDK for LLM operations

#### System Utilities

- [@synstack/fs](./packages/fs/README.md) - File system operations made easy
- [@synstack/fs-cache](./packages/fs-cache/README.md) - Human-friendly file system caching
- [@synstack/git](./packages/git/README.md) - Subset of useful git commands for LLM scripts
- [@synstack/enhance](./packages/enhance/README.md) - Proxy based utilities to enhance objects and functions with additional capabilities
- [@synstack/glob](./packages/glob/README.md) - Glob pattern matching and file filtering utilities

#### Web Scraping

- [@synstack/web](./packages/web/README.md) - Web scraping utilities

#### Data formats

- [@synstack/json](./packages/json/README.md) - Type-safe JSON serialization and deserialization. Available directly through @synstack/fs
- [@synstack/yaml](./packages/yaml/README.md) - Opiniated type-safe YAML serialization and deserialization. Available directly through @synstack/fs
- [@synstack/xml](./packages/xml/README.md) - Lax, non spec-compliant XML utils tailored for LLMs
- [@synstack/markdown](./packages/markdown/README.md) - Type-safe markdown processing with YAML frontmatter support

#### Functional Programming

- [@synstack/pipe](./packages/pipe/README.md) - Simple typesafe pipe utility for Functional Programming
- [@synstack/resolved](./packages/resolved/README.md) - A piping utility which preserves the sync/async state of the value

#### Text Processing

- [@synstack/text](./packages/text/README.md) - String templating as it was meant to be
- [@synstack/str](./packages/str/README.md) - Advanced chainable string manipulation

# Dependency Graph

```mermaid
graph TD
  %% Packages
  synscript["@synstack/synscript"]
  enhance["@synstack/enhance"]
  fs["@synstack/fs"]
  fs_cache["@synstack/fs-cache"]
  git["@synstack/git"]
  glob["@synstack/glob"]
  json["@synstack/json"]
  llm["@synstack/llm"]
  markdown["@synstack/markdown"]
  path["@synstack/path"]
  pipe["@synstack/pipe"]
  reforge["@synstack/reforge"]
  resolved["@synstack/resolved"]
  str["@synstack/str"]
  text["@synstack/text"]
  web["@synstack/web"]
  xml["@synstack/xml"]
  yaml["@synstack/yaml"]
  %% Internal Dependencies
  synscript --> enhance
  synscript --> fs
  synscript --> fs_cache
  synscript --> git
  synscript --> glob
  synscript --> json
  synscript --> llm
  synscript --> markdown
  synscript --> path
  synscript --> pipe
  synscript --> reforge
  synscript --> resolved
  synscript --> str
  synscript --> text
  synscript --> web
  synscript --> xml
  synscript --> yaml
  fs --> enhance
  fs --> git
  fs --> glob
  fs --> json
  fs --> path
  fs --> pipe
  fs --> str
  fs --> xml
  fs --> yaml
  fs_cache --> fs
  glob --> path
  llm --> enhance
  llm --> json
  llm --> resolved
  llm --> text
  markdown --> yaml
  path --> pipe
  pipe --> enhance
  str --> pipe
  text --> json
  text --> resolved
  text --> str
  %% External Dependencies
  web --> readability["@mozilla/readability"]
  web --> linkedom
  xml --> immer
  yaml --> yaml_pkg["yaml"]
  llm --> zod_json["zod-to-json-schema"]
  %% Styling
  classDef default fill:#f9f,stroke:#333,stroke-width:2px,color:#000;
  classDef external fill:#bbf,stroke:#333,stroke-width:1px,color:#000;
  class readability,linkedom,immer,yaml_pkg,zod_json external
```
