import { reforge, str, xml } from "@synstack/synscript";
import { Llm } from "@synstack/synscript/llm";
import { Xml } from "@synstack/synscript/xml";
import {
  baseCache,
  baseCompletion,
  completionRunner,
} from "../runtime/completion.runtime.ts";
import { BaseContext } from "../runtime/context.runtime.ts";
import { rootDir } from "../runtime/workspace.runtime.ts";

export async function fileAgent<TContext extends BaseContext>(
  context: TContext,
  prompt: (context: TContext) => Array<Llm.Message>,
) {
  const completion = baseCompletion.messages(prompt(context));
  const response = await completion.run(
    completionRunner.cache(
      baseCache.key([context.focusedFile.relativePathFrom(rootDir)]),
    ),
  );
  response
    .lastMessageText()
    .then((text) => {
      console.log(text);
      return text;
    })
    .then(writeResponseToFiles)
    .then(formatFiles);
}

/**
 * - Used to parse the LLM response and extract the files
 *  - Extracts <file> tags from the LLM response
 *  - Returns the extracted file formated into a JS object
 */
const extractFiles = (content: string) => {
  const parsedXml = xml.parse(content);
  return parsedXml
    .filter(
      (node): node is Xml.Node.Tag =>
        node.type === "tag" && node.tag === "file",
    )
    .map((n) => ({
      path: n.attrs!.path,
      source: n.attrs!.source,
      content: str(xml.nodesToText(n.content)).dedent().trim().$,
    }));
};

/**
 * Writes the extracted files to the target folder
 */
const writeFiles = (
  filesData: Array<{ path: string; content: string; source: string }>,
) => {
  return Promise.all(
    filesData.map(async (file) => {
      const { path, content } = file;
      const outputFile = rootDir.file(path);
      await outputFile.write.text(content);
      return outputFile;
    }),
  );
};

/**
 * - Extracts the files from the LLM response using `<file>` tags
 * - Writes the files to the target folder
 * - Opens the written files in the editor
 *
 * _This method is prefered over using tool calling as a json structure
 * forces the LLM to escape every double quote, which often breaks on long
 * files and may impact the response's enthropy_
 */
export const writeResponseToFiles = async (response: string) => {
  const filesData = extractFiles(response);
  const writtenFiles = await writeFiles(filesData);
  await reforge.openFiles({
    paths: writtenFiles.map((f) => f.path),
  });
  return writtenFiles;
};

async function formatFiles(files: Array<FsFile>) {
  return files.map((f) => {
    const formattedFile = f.toFile(f.name() + ".formatted");
    return formattedFile.write.text(f.text());
  });
}
