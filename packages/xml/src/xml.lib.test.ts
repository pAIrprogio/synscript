import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parse,
  parseAttributes,
  splitXmlTags,
  xmlAttributeRegex,
  xmlClosingTagRegex,
  xmlOpeningTagRegex,
} from "./xml.lib";

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
        type: "root",
        attrs: {
          attr1: "value1",
          attr2: "value2",
        },
        content: [
          { type: "text", text: "\n" },
          {
            type: "child",
            attrs: {},
            content: [
              { type: "text", text: "Content" },
              { type: "alone", attrs: {}, content: [], text: "<alone/>" },
            ],
            text: "<child>Content<alone/></child>",
          },
          { type: "text", text: "\n" },
        ],
        text: '<root\nattr1="value1"\nattr2="value2"\n>\n<child>Content<alone/></child>\n</root>',
      },
    ]);
  });
  it("transforms unclosed tags as text", () => {
    assert.deepEqual(parse("<root><child>Content<a/></root>"), [
      {
        type: "root",
        attrs: {},
        content: [{ type: "text", text: "<child>Content<a/>" }],
        text: "<root><child>Content<a/></root>",
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
});
