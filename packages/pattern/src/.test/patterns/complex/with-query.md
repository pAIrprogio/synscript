---
query:
  and:
    - contains: 'component'
    - or:
        - hasExtension: ['tsx']
        - hasExtension: ['jsx']
    - not:
        contains: 'deprecated'
---

Complex pattern with nested logical operators.
