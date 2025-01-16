import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parse,
  parseAttributes,
  splitXmlTags,
  xmlAttributeRegex,
  xmlClosingTagRegex,
  xmlOpeningTagRegex,
} from "./xml.lib.ts";

describe("XML Opening Tag Regex", () => {
  it("should match a simple tag", () => {
    const match = "<tag>".match(xmlOpeningTagRegex);
    const [text, tagName, attributes] = match!;
    assert.equal(text, "<tag>");
    assert.equal(tagName, "tag");
    assert.deepEqual(attributes, "");
  });

  it("should match a tag with underscores and numbers", () => {
    const match = "<tag_1>".match(xmlOpeningTagRegex);
    const [text, tagName, attributes] = match!;
    assert.equal(text, "<tag_1>");
    assert.equal(tagName, "tag_1");
    assert.deepEqual(attributes, "");
  });

  it("should match a tag with colons and hyphens", () => {
    const match = "<ns:tag-name>".match(xmlOpeningTagRegex);
    const [text, tagName, attributes] = match!;
    assert.equal(text, "<ns:tag-name>");
    assert.equal(tagName, "ns:tag-name");
    assert.deepEqual(attributes, "");
  });

  it("should not match a tag starting with a number", () => {
    const match = "<1tag>".match(xmlOpeningTagRegex);
    assert.equal(match, null);
  });

  it("should match a tag with a single attribute", () => {
    const match = '<tag attr="value">'.match(xmlOpeningTagRegex);
    const [text, tagName, attributes] = match!;
    assert.equal(text, '<tag attr="value">');
    assert.equal(tagName, "tag");
    assert.equal(attributes.trim(), 'attr="value"');
  });

  it("should match a tag with multiple attributes", () => {
    const match = '<tag attr1="value1" attr2="value2">'.match(
      xmlOpeningTagRegex,
    );
    const [text, tagName, attributes] = match!;
    assert.equal(text, '<tag attr1="value1" attr2="value2">');
    assert.equal(tagName, "tag");
    assert.deepEqual(attributes.trim(), 'attr1="value1" attr2="value2"');
  });

  it("should match a tag with attributes and extra whitespace", () => {
    const match = '<tag   attr1="value1"    attr2="value2"   >'.match(
      xmlOpeningTagRegex,
    );
    const [text, tagName, attributes] = match!;
    assert.equal(text, '<tag   attr1="value1"    attr2="value2"   >');
    assert.equal(tagName, "tag");
    assert.equal(attributes, '   attr1="value1"    attr2="value2"');
  });

  it("should not match a tag with invalid attribute names", () => {
    const match = '<tag 1attr="value">'.match(xmlOpeningTagRegex);
    assert.equal(match, null);
  });

  it("should not match a tag with unclosed attribute value", () => {
    const match = '<tag attr="value>'.match(xmlOpeningTagRegex);
    assert.equal(match, null);
  });

  it("should not match a tag without a closing angle bracket", () => {
    const match = '<tag attr="value"<'.match(xmlOpeningTagRegex);
    assert.equal(match, null);
  });

  it("should not match a closing tag", () => {
    const match = "</tag>".match(xmlOpeningTagRegex);
    assert.equal(match, null);
  });

  it("should match a self-closing tag", () => {
    const match = "<tag />".match(xmlOpeningTagRegex);
    const [text, tagName, attributes, selfClosing] = match!;
    assert.equal(text, "<tag />");
    assert.equal(tagName, "tag");
    assert.deepEqual(attributes, "");
    assert.equal(selfClosing, "/");
  });

  it("should work on multiline input", () => {
    const input = `
<root
attr1="value1"
attr2="value2"
>
    `.trim();
    const match = input.match(xmlOpeningTagRegex);
    const [text, tagName, attributes] = match!;
    assert.equal(text, '<root\nattr1="value1"\nattr2="value2"\n>');
    assert.equal(tagName, "root");
    assert.equal(attributes, '\nattr1="value1"\nattr2="value2"');
  });
});

describe("XML Closing Tag Regex", () => {
  it("should match a simple tag", () => {
    const match = "</tag>".match(xmlClosingTagRegex);
    const [text, tagName] = match!;
    assert.equal(text, "</tag>");
    assert.equal(tagName, "tag");
  });
  it("should match a tag with underscores and numbers", () => {
    const match = "</tag_1>".match(xmlClosingTagRegex);
    const [text, tagName] = match!;
    assert.equal(text, "</tag_1>");
    assert.equal(tagName, "tag_1");
  });
  it("should match a tag with colons and hyphens", () => {
    const match = "</ns:tag-name>".match(xmlClosingTagRegex);
    const [text, tagName] = match!;
    assert.equal(text, "</ns:tag-name>");
    assert.equal(tagName, "ns:tag-name");
  });
});

describe("XML Attribute Regex", () => {
  it("should match a simple attribute", () => {
    const matches = [...'attr="value"'.matchAll(xmlAttributeRegex)];
    assert.deepEqual([...matches[0]], ['attr="value"', "attr", "value"]);
  });
});

describe("XML Attributes Parser", () => {
  it("should parse no attributes", () => {
    const attributes = "";
    const res = parseAttributes(attributes);
    assert.deepEqual(res, {});
  });
  it("should parse a simple attribute", () => {
    const attributes = ' attr="value"   ';
    const res = parseAttributes(attributes);
    assert.deepEqual(res, {
      attr: "value",
    });
  });
  it("should parse multiple attributes", () => {
    const attributes = ' attr1="value1"   attr2="value2"  ';
    const res = parseAttributes(attributes);
    assert.deepEqual(res, {
      attr1: "value1",
      attr2: "value2",
    });
  });
});

describe("XML Splitter", () => {
  it("should split text with tags", () => {
    const input = `
<root
attr1="value1"
attr2="value2"
>
<child>Content<alone/></child>
</root>
    `.trim();
    const res = splitXmlTags(input);
    assert.deepEqual(res, [
      {
        type: "tagOpen",
        name: "root",
        attrs: {
          attr1: "value1",
          attr2: "value2",
        },
        text: '<root\nattr1="value1"\nattr2="value2"\n>',
      },
      { type: "text", text: "\n" },
      {
        type: "tagOpen",
        attrs: {},
        name: "child",
        text: "<child>",
      },
      { type: "text", text: "Content" },
      {
        type: "tagSelfClose",
        attrs: {},
        name: "alone",
        text: "<alone/>",
      },
      {
        type: "tagClose",
        name: "child",
        text: "</child>",
      },
      { type: "text", text: "\n" },
      {
        type: "tagClose",
        name: "root",
        text: "</root>",
      },
    ]);
  });

  it("should parse invalid xml", () => {
    const input = "<root><child>Content</child><root>";
    assert.deepEqual(splitXmlTags(input), [
      {
        type: "tagOpen",
        attrs: {},
        name: "root",
        text: "<root>",
      },
      {
        type: "tagOpen",
        attrs: {},
        name: "child",
        text: "<child>",
      },
      { type: "text", text: "Content" },
      {
        type: "tagClose",
        name: "child",
        text: "</child>",
      },
      {
        type: "tagOpen",
        name: "root",
        attrs: {},
        text: "<root>",
      },
    ]);
  });
});

describe("XML parser", () => {
  it("should parse a simple xml", () => {
    const input = `
Hi
<root
attr1="value1"
attr2="value2"
>
<child>Content<alone/></child>
</root>
    `.trim();
    const res = parse(input);
    assert.deepEqual(res, [
      { type: "text", text: "Hi\n" },
      {
        type: "tag",
        tag: "root",
        attrs: {
          attr1: "value1",
          attr2: "value2",
        },
        content: [
          { type: "text", text: "\n" },
          {
            type: "tag",
            tag: "child",
            attrs: {},
            content: [
              { type: "text", text: "Content" },
              {
                type: "tag",
                tag: "alone",
                attrs: {},
                content: [],
                text: "<alone/>",
              },
            ],
            text: "<child>Content<alone/></child>",
          },
          { type: "text", text: "\n" },
        ],
        text: '<root\nattr1="value1"\nattr2="value2"\n>\n<child>Content<alone/></child>\n</root>',
      },
    ]);
  });
  it("handles mismatched tags by treating them as text", () => {
    const input = "<file><a>text</b></file>";
    const result = parse(input);
    assert.deepEqual(result, [
      {
        type: "tag",
        tag: "file",
        attrs: {},
        content: [
          {
            type: "text",
            text: "<a>text</b>",
          },
        ],
        text: "<file><a>text</b></file>",
      },
    ]);
  });
  it("transforms unclosed root tags as text", () => {
    assert.deepEqual(parse("<root><child>Content</child><root>"), [
      {
        type: "text",
        text: "<root><child>Content</child><root>",
      },
    ]);
  });
  it("works on complex structures", () => {
    const input = `
<file path="target/agent/prompt-updater.prompt.mts" source="target">
import { FsFile } from '@synstack/synscript/fs';
import { assistantMsg, userMsg } from '@synstack/synscript/llm';

import { targetFilesToPrompt } from '../../agents/agent.utils.mjs';
import { reforgeDir } from '../../base.runtime.mjs';

type PromptConfig = {
  agentPromptFile: FsFile;
};

export const getAgentPrompt = (config: PromptConfig) => [
  userMsg\`
    # Objective 
    Enhance the prompt of the following agent.

    # Existing file 
    \${targetFilesToPrompt([config.agentPromptFile])}

    # Rules
    <rule>
      Edit it following <instruction> tags.
    </rule> 

    <rule>
      If there is no <instruction> tag, return content as is.
    </rule>

    <rule>
      Remove <instruction/> tag 
    </rule>

    # Expected response
    Respond with file content with prompt updated.
  \`,
  assistantMsg\`
    <file path"\${config.agentPromptFile.relativePathFrom(
      reforgeDir,
    )}" source="target">
    \`,
];
</file>
`;

    const res = parse(input);
    assert.deepEqual(res, [
      {
        type: "tag",
        tag: "file",
        attrs: {
          path: "target/agent/prompt-updater.prompt.mts",
          source: "target",
        },
        text: "<file path=\"target/agent/prompt-updater.prompt.mts\" source=\"target\">\nimport { FsFile } from '@synstack/synscript/fs';\nimport { assistantMsg, userMsg } from '@synstack/synscript/llm';\n\nimport { targetFilesToPrompt } from '../../agents/agent.utils.mjs';\nimport { reforgeDir } from '../../base.runtime.mjs';\n\ntype PromptConfig = {\n  agentPromptFile: FsFile;\n};\n\nexport const getAgentPrompt = (config: PromptConfig) => [\n  userMsg`\n    # Objective \n    Enhance the prompt of the following agent.\n\n    # Existing file \n    ${targetFilesToPrompt([config.agentPromptFile])}\n\n    # Rules\n    <rule>\n      Edit it following <instruction> tags.\n    </rule> \n\n    <rule>\n      If there is no <instruction> tag, return content as is.\n    </rule>\n\n    <rule>\n      Remove <instruction/> tag \n    </rule>\n\n    # Expected response\n    Respond with file content with prompt updated.\n  `,\n  assistantMsg`\n    <file path\"${config.agentPromptFile.relativePathFrom(\n      reforgeDir,\n    )}\" source=\"target\">\n    `,\n];\n</file>",
        content: [
          {
            type: "text",
            text: "\nimport { FsFile } from '@synstack/synscript/fs';\nimport { assistantMsg, userMsg } from '@synstack/synscript/llm';\n\nimport { targetFilesToPrompt } from '../../agents/agent.utils.mjs';\nimport { reforgeDir } from '../../base.runtime.mjs';\n\ntype PromptConfig = {\n  agentPromptFile: FsFile;\n};\n\nexport const getAgentPrompt = (config: PromptConfig) => [\n  userMsg`\n    # Objective \n    Enhance the prompt of the following agent.\n\n    # Existing file \n    ${targetFilesToPrompt([config.agentPromptFile])}\n\n    # Rules\n    ",
          },
          {
            type: "tag",
            tag: "rule",
            attrs: {},
            text: "<rule>\n      Edit it following <instruction> tags.\n    </rule>",
            content: [
              {
                type: "text",
                text: "\n      Edit it following ",
              },
              {
                type: "text",
                text: "<instruction> tags.\n    ",
              },
            ],
          },
          {
            type: "text",
            text: " \n\n    ",
          },
          {
            type: "tag",
            tag: "rule",
            attrs: {},
            text: "<rule>\n      If there is no <instruction> tag, return content as is.\n    </rule>",
            content: [
              {
                type: "text",
                text: "\n      If there is no ",
              },
              {
                type: "text",
                text: "<instruction> tag, return content as is.\n    ",
              },
            ],
          },
          {
            type: "text",
            text: "\n\n    ",
          },
          {
            type: "tag",
            tag: "rule",
            attrs: {},
            text: "<rule>\n      Remove <instruction/> tag \n    </rule>",
            content: [
              {
                type: "text",
                text: "\n      Remove ",
              },
              {
                type: "tag",
                tag: "instruction",
                attrs: {},
                text: "<instruction/>",
                content: [],
              },
              {
                type: "text",
                text: " tag \n    ",
              },
            ],
          },
          {
            type: "text",
            text: '\n\n    # Expected response\n    Respond with file content with prompt updated.\n  `,\n  assistantMsg`\n    <file path"${config.agentPromptFile.relativePathFrom(\n      reforgeDir,\n    )}" source="target">\n    `,\n];\n',
          },
        ],
      },
    ]);
  });
});
