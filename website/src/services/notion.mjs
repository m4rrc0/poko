import { Client } from "@notionhq/client";
// import "dotenv/config";
import { NotionToMarkdown } from "notion-to-md";
import { getImage, getPicture } from "@astrojs/image";
import probeImageSize from "probe-image-size";
import _set from "lodash.set";
// import { VFile } from "vfile";
// import * as preactRuntime from "preact/jsx-runtime";
// If we want to use Svelte, we might use the jsx-runtime from https://github.com/kenoxa/svelte-jsx/blob/main/src/jsx-runtime.js
// To use with React, apparently we need this
// import * as rt from "../../node_modules/react/jsx-runtime.js";
// const runtime = { default: { Fragment: Symbol(react.fragment), jsx: [Function: jsxWithValidationDynamic], jsxs: [Function: jsxWithValidationStatic] }, [Symbol(Symbol.toStringTag)]: 'Module' }
// import { compile, evaluate } from "@mdx-js/mdx";
// import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
// import remarkMdxFrontmatter from "remark-mdx-frontmatter";
// import remarkUnwrapImages from "remark-unwrap-images";
// import remarkGfm from "remark-gfm";
// import rehypeSlug from "rehype-slug";

// import { parseFileUrl } from "@utils/index.mjs";
import { getPresets } from '@services/poko.mjs'

// NOTE: for some reason `preact/jsx-runtime`does not yield the same export on `dev` ad `build` commands
// const runtime = preactRuntime.default || preactRuntime;

// import { compile as mdxCompile } from "@mdx-js/mdx";

/// --- INITIALIZE --- ///
const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
const NOTION_ROOT_ID = import.meta.env.NOTION_ROOT_ID;
// Initializing notion client
const notion = new Client({ auth: NOTION_TOKEN });

// NotionToMarkdown: passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

n2m.setCustomTransformer("image", async (block) => {
  // console.log(block)
  const { image } = block;
  if (image.type !== "file") return null;

  const originalUrl = image.file.url;
  const alt = image.caption.map(({ plain_text }) => plain_text).join("");
  // TO ANNOTATE RICH TEXT WITH MD SYNTAX
  // let alt = "";
  // image.caption.forEach((rich_text) => {
  //   alt += n2m.annotatePlainText(rich_text.plain_text, rich_text.annotations);
  // });

  const {
    width,
    height,
    type,
    /* mime,wUnits,hUnits,length,url */
  } = await probeImageSize(originalUrl);

  // console.log({ type });

  const i = await getImage({
    src: originalUrl,
    alt,
    format: type,
    width,
    height,
    // quality: 90,
    // aspectRatio: width / height,
    // width: width > 2000 ? 2000 : width,
  });

  // console.log({ i });

  // const p = await getPicture({
  //   src: originalUrl,
  //   formats: [type, "webp", "avif"],
  //   width,
  //   height,
  //   aspectRatio: width / height,
  //   alt,
  //   widths: [200, 400, 800],
  //   sizes: "(max-width: 800px) 100vw, 800px",
  // });

  // console.log({ originalUrl, p, sources: p.sources });

  return `<img src="${i.src}" alt="${i.alt}" width="${i.width}" height="${i.height}" />`;
});

n2m.setCustomTransformer("child_page", async (block) => {
  const { child_page } = block;
  // console.log(block);
  //   inlineMd = `<ChildPage blockId="${block.id}" pageName="${block.child_page?.title}" />`;
  return `<ChildPage block={${JSON.stringify(block)}} />`;
});

n2m.setCustomTransformer("child_database", async (block, ...rest) => {
  const { child_database } = block;
  // TODO: HERE
  return `<Collection block={${JSON.stringify(block)}} blockId="${block.id}" collectionName="${block.child_database?.title}" />`;
  // return `<ChildPage block={${JSON.stringify(block)}} />`;
});

// n2m.setCustomTransformer("toggle", async (block) => {
//   const { toggle } = block;
//   // console.log(toggle);
//   // return "";
//   let toggle_text = "";
//   toggle.rich_text.forEach((rich_text) => {
//     toggle_text += n2m.annotatePlainText(
//       rich_text.plain_text,
//       rich_text.annotations
//     );
//   });
//   return toggle_text;
// });

// --- FETCH --- //

export async function getNotionPage(page_id = NOTION_ROOT_ID) {
  const _page = await notion.pages.retrieve({ page_id });
  //   const page = await complementDbData(_page);
  return _page;
}

export async function getAllNotionPages() {
  let _pages = [];
  let start_cursor;
  let has_more = true;
  while (has_more) {
    const newPages = await notion.search({
      start_cursor,
      page_size: 100,
    });
    _pages = [..._pages, ...newPages?.results];
    start_cursor = newPages.next_cursor;
    has_more = newPages.has_more;
  }

  return _pages;
}

export async function getBlockChildren(block_id = NOTION_ROOT_ID) {
  let blocks = [];
  let start_cursor;
  let has_more = true;
  while (has_more) {
    const newBlocks = await notion.blocks.children.list({
      block_id,
      start_cursor,
      page_size: 100,
    });
    blocks = [...blocks, ...newBlocks?.results];
    start_cursor = newBlocks.next_cursor;
    has_more = newBlocks.has_more;
  }

  return blocks;
}

export async function getBlockChildrenRecursively(
  blocksOrBlock = NOTION_ROOT_ID,
  allPages,
  _currentPageId,
  notAPage
) {
  // blocksOrBlock can be [...blocks], "id_of_block", {...block}
  // We want to know the current page ID (for child_page block type)
  let _blocks;
  let currentPageId = _currentPageId;
  if (Array.isArray(blocksOrBlock)) {
    _blocks = blocksOrBlock;
  } else if (typeof blocksOrBlock === "string") {
    // only the ID. It means it is the first call and the id of a page (probably the root page)
    if (!(notAPage === true)) {
      currentPageId = blocksOrBlock;
    }
    _blocks = await getBlockChildren(blocksOrBlock);
  } else if (typeof blocksOrBlock === "object") {
    // it is an object, not necessarily a page though.
    if (
      blocksOrBlock.object === "page" ||
      blocksOrBlock.object === "database"
    ) {
      currentPageId = blocksOrBlock.id;
    }
    _blocks = await getBlockChildren(blocksOrBlock.id);
  } else {
    console.error(
      `Wrong argument provided to getBlockChildrenRecursively: blocksOrBlock = ${blocksOrBlock}`
    );
  }

  const blocks = await Promise.all(
    _blocks.map(async (_block) => {
      let block = _block;

      // compute inlineMd and look into md to check for possible notion id
      // if (block.object !== "page") {
      //   const inlineMd = await notionBlockToMd(_block);
      //   const _mayHaveNotionLink = !!inlineMd?.match(/\/[0-9a-z\-]{32}/);
      //   block = { ..._block, inlineMd, parent: inlineMd, _mayHaveNotionLink };
      // }

      // let blockId;
      let children;
      const syncedBlockId = block?.synced_block?.synced_from?.block_id;
      const linkToPageId =
        block?.link_to_page?.page_id || block?.link_to_page?.database_id;
      const childPageTitle =
        block?.child_page?.title || block?.child_database?.title;

      if (syncedBlockId) {
        children = await getBlockChildrenRecursively(
          syncedBlockId,
          allPages,
          currentPageId,
          true
        );
      } else if (linkToPageId) {
        // We handle this elsewhere when 'allPages' is not provided
        if (allPages) {
          // Only fetch page data, not children recursively
          const page = allPages.find((p) => p.id === linkToPageId);
          children = [page];
        }
      } else if (childPageTitle) {
        // A 'child_page' block
        // We handle this elsewhere when 'allPages' is not provided
        if (allPages) {
          const pages = allPages
            .filter((p) => {
              return p._codeName === childPageTitle;
            })
            .filter((p) => {
              return p.parentId === currentPageId;
            });

          let subChildren = [];
          if (pages[0].object === "database") {
            // TODO: might be an inline DB or just a subPage...
            subChildren = allPages.filter((p) => {
              return p.parentId === pages[0].id;
            });
          } else {
            subChildren = await getBlockChildrenRecursively(
              pages[0],
              allPages,
              currentPageId
            );
          }

          const page = { ...pages[0], children: subChildren };
          children = [page];
        }
      } else if (!block.has_children) {
        return block;
      } else {
        children = await getBlockChildrenRecursively(
          block,
          allPages,
          currentPageId
        );
      }

      //   const _children = await getBlockChildren(block.id);
      //   const children = await getBlockChildrenRecursively(_children);

      return { ...block, parentPageId: currentPageId, children };
    })
  );

  // allPages.forEach((p) => {
  //   console.log({ properties: p.properties, props: p._props });
  // });

  return blocks;

  //   return { blocksCopy: bc, blocks: blocksPopulated };
}

// --- NOTION TO MD --- //

export async function notionBlockToMd(block) {
  let inlineMd;
  switch (block.type) {
    // case "child_database":
    //   inlineMd = `<Collection blockId="${block.id}" collectionName="${block.child_database?.title}" />`;
    //   break;
    // case "child_page":
    //   inlineMd = `<ChildPage blockId="${block.id}" pageName="${block.child_page?.title}" />`;
    //   break;
    // case "link_to_page":
    //   console.log({
    //     block,
    //     pageId:
    //       block?.link_to_page?.page_id || block?.link_to_page?.database_id,
    //   });
    //   inlineMd = `<BlockLinkPage blockId="${block.id}" pageId="${
    //     block?.link_to_page?.page_id || block?.link_to_page?.database_id
    //   }" />`;
    //   break;
    // case "numbered_list_item":
    //   // Not handled properly by notion-to-markdown apparently
    //   inlineMd = await n2m.blockToMarkdown(block);
    //   inlineMd = inlineMd.replace(/^-/, "1.");
    //   break;
    // // case "column_list":
    // //   // console.log(block);
    // //   inlineMd = `<Columns blockId="${block.id}"></Columns>`;
    // //   break;
    // // case "column":
    // //   // inlineMd = `<Column blockId="${block.id}"></Column>`;
    // //   break;
    // case "toggle":
    // // inlineMd = ``;
    // // break;
    // case "synced_block":
    // case "paragraph":
    // case "image":
    // case "file":
    // case "code":
    // case "bulleted_list_item":
    // case "heading_1":
    // case "heading_2":
    // case "heading_3":
    // case "quote":
    // case "divider":
    // case "callout":
    default:
      inlineMd = await n2m.blockToMarkdown(block);
      break;
  }
  // if (blockType === "child_page") {
  //   inlineMd = ``;
  //   console.log({ blockType, inlineMd });
  // } else if (blockType === "child_database") {
  //   inlineMd = `<collection><h3>Collection</h3>{pages && pages?.map(page => <collection-item {...page} />)}</collection>`;
  //   // TODO: fetch children pages ?? -> Should be children of the db page itself
  //   console.log({ blockType, inlineMd, block });
  // } else {
  // }
  return inlineMd;
}

export function treeToMd(blocks) {
  // if (!blocks || !Array.isArray(blocks.children)) return undefined;
  const mdString = n2m
    .toMarkdownString(blocks)
    .trim() // trim() to remove leading (and trailing) "\n" to allow top level frontmatter
    // .replace(/(\r\n|\r|\n)/, `\s\s\n`) // TODO: find a way to keep simple line breaks
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/⇒/g, "=>")
    .replace(/→/g, "->")
    .replace(/—/g, "-");
  // console.log({ mdString });
  return mdString;
}

// export async function toMdx(mdString, debugString) {
//   let MDXContent = undefined;
//   let exports = undefined;

//   try {
//     // const { default: MDXContentIn, ...exportsIn } = await compile(
//     const { default: MDXContentIn, exports: exportsIn } = await evaluate(
//       //   new VFile({ path: "path/to/file.mdx", value: mdString }),
//       String(mdString),
//       {
//         // ...runtime,
//         remarkPlugins: [
//           [
//             remarkFrontmatter,
//             {
//               type: "yaml",
//               fence: { open: "```yaml", close: "```" },
//               anywhere: true,
//             },
//           ],
//           [remarkMdxFrontmatter, { name: "exports" }],
//           // remarkUnwrapImages,
//           remarkGfm,
//         ],
//         rehypePlugins: [rehypeSlug],
//       }
//     );
//     MDXContent = MDXContentIn;
//     exports = exportsIn;
//   } catch (error) {
//     // console.error(
//     //   `Error evaluating with MDX: ${debugString || `\n${mdString}`}`
//     // );
//     // console.info(`Page info:\n`, { slug, path, mdString });
//     console.error(error);
//     const matches = mdString.match(/.*\n/g);
//     console.log(
//       "The error is here:\n",
//       matches.slice(error.line - 6, error.line + 4).join("")
//     );
//     throw error;
//   }

//   return { MDXContent, exports };
// }

// --- TRANSFORM --- //

export function populateChildPageOfBlock(_block, allRawPages) {
  let block = _block;
  let children = _block.children;

  const linkToPageId =
    _block?.link_to_page?.page_id || _block?.link_to_page?.database_id;
  const childPageTitle =
    _block?.child_page?.title || _block?.child_database?.title;

  if (linkToPageId && !children?.length) {
    // Only place page data, not children recursively
    const pageAndChildren = allRawPages.find((p) => p.id === linkToPageId);
    // console.log(`Injecting page with linkToPage ${pageAndChildren._codeName}`);

    const { children: _, ...page } = pageAndChildren;
    children = [page];
  } else if (childPageTitle && !children?.length) {
    // A 'child_page' _block
    const childPage = allRawPages
      .filter((p) => {
        return p.codeName === childPageTitle;
      })
      .filter((p) => {
        return p.parentId === _block.parentPageId;
      })[0];

    // console.log(`Injecting page with childPage ${childPage._codeName}`);

    let subChildren;
    if (childPage?.object === "database") {
      // TODO: might be an inline DB or just a subPage...
      subChildren = allRawPages.filter((p) => {
        if (p.parentId === childPage.id) {
          // console.log(`Injecting page in DB ${childPage._codeName}`);
        }
        return p.parentId === childPage.id;
      });
    }

    const page = {
      ...childPage,
      children: subChildren || childPage.children,
    };
    children = [page];
  }
  return children;
}

export function transformRawPage(p) {
  const _parentType = p?.parent?.type;
  // The title of a Pages is always 'Title'. For a collection item it can be anything but then the property has a type of 'title'
  let _titlePropName = "title";
  if (_parentType === "database_id") {
    // A collection item
    Object.entries(p?.properties).forEach(([propName, propVal]) => {
      if (propVal.type === "title") _titlePropName = propName;
    });
  }
  const _title =
    p?.title || // database
    p?.properties?.title?.title || // page
    p?.properties?.[_titlePropName]?.title; // collection item

  const codeName = _title?.map(({ plain_text }) => plain_text).join("");
  const parentId = _parentType === 'workspace' ? null : p.parent[_parentType];

  return codeName
    ? {
        ...p,
        _title,
        codeName,
        _titlePropName,
        parentId,
        // _props,
      }
    : null; // pages are created automatically in DBs. If no title, we don't want them
}

export function transformRichTextToPlainText(_val) {
  if (typeof _val === "string") return _val;
  if (Array.isArray(_val))
    return _val.map(({ plain_text }) => plain_text).join("");
  // Can be object if value is empty
  if ((typeof _val).match(/undefined|object/)) return undefined;

  return _val;
}

export const stringToVarName = _str => {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/-,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz______";
  const p = new RegExp(a.split("").join("|"), "g");

  const str = _str
    .toString()
    // .toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with _
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w.]+/g, "") // Remove all non-word characters except "." [^\w.]
    .replace(/\_\_+/g, "_") // Replace multiple _ with single _
    .replace(/^_+/, "") // Trim _ from start of text
    .replace(/_+$/, ""); // Trim _ from end of text

  if (_str !== str) {
    console.warn(`WARNING: Your property name "${_str}" has been replaced by "${str}"`)
  }
  return str
}

export function transformProp([_key, _val] = [], role) {
  // let key = stringToVarName(_key);
  let key = _key;
  // name === _key
  // not sure id is useful
  // type tells us where to find the actual value
  const { id, name, type } = _val;
  let val = _val[type];

  if (role === "collection") {
    key = `_definition.${_key}`;
    val = _val;
  } else if (type === "title" || type === "rich_text") {
    // title can be a string or a rich_text field
    // console.log({ type, key, val });
    // console.dir(val, { depth: null });

    val = transformRichTextToPlainText(val);
  } else if (type === "multi_select" && Array.isArray(val.options)) {
    val = val.options.map(({ name }) => name);
  } else if (type === "select") {
    val = val?.name;
  } else if (type === "files") {
    // console.log(val)
    // TODO: handle files in properties
    // val = val.map((f) => {
    //   const {
    //     /*name, type, */ file: { url: originalUrl },
    //   } = f;
    //   const { filename, extension } = parseFileUrl(originalUrl);
    //   const url = `/${dirUserAssets}/${filename}`;
    //   // if (key.match("jsonld")) {
    //   //   return url;
    //   // }
    //   return { originalUrl, filename, extension, url };
    // });
  } else if (type === "date") {
    // if (val?.start && !val?.end && !val?.time_zone) {
    //   val = val?.start;
    // }
  } else if (type === "relation") {
    // console.log({ type, key, _val, val });
    // TODO: transform link OR have the page data in directly?
  } else if (type === "formula") {
    const formulaType = val.type
    val = val[formulaType]
  } else if (type) {
    // TODO: handle more types
    // val = _val[type];
    //
  }

  // ?? TODO: map notion prop types to own types???
  // All props types: "title", "rich_text", "number", "select", "multi_select", "date", "people", "files", "checkbox", "url", "email", "phone_number", "formula", "relation", "rollup", "created_time", "created_by", "last_edited_time", "last_edited_by",

  if (key.match(/\./)) {
    let obj = {};
    _set(obj, key, val);
    return obj;
  }

  return { [key]: val };
}

// --- UTILS --- //

export function rootId() {
  return NOTION_ROOT_ID;
}

// const probeFile = async (fileObject) => {
//   try {
//     const { url: _, ...probe } = await probeImageSize(fileObject.originalUrl);
//     // console.log({ probe });
//     return { ...fileObject, ...probe };
//   } catch (error) {
//     // console.error(error);
//     return fileObject;
//   }
// };

// const probeHeaders = async (fileObject) => {
//   try {
//     const _f = await fetch(fileObject.originalUrl);
//     const headers = await _f.headers;
//     const length = headers.get("content-length");
//     const mime = headers.get("content-type");
//     const etag = headers.get("etag");
//     const _last_modified = headers.get("last-modified");
//     const last_modified = new Date(_last_modified).toISOString();
//     // console.log({ length, mime, etag, last_modified });

//     return { ...fileObject, length, mime, etag, last_modified };
//   } catch (error) {
//     return fileObject;
//   }
// };

// --- DICTIONARIES --- //

export const dicoNotionBlockTypes = {
  paragraph: "p",
  heading_1: "h1",
  heading_2: "h2",
  heading_3: "h3",
  bulleted_list_item: "ul",
  numbered_list_item: "ol",
  code: "code",
  to_do: "todo",
  toggle: "toggle",
  child_page: "page",
  child_database: "collection",
  embed: "embed",
  image: "img",
  video: "video",
  file: "file",
  pdf: "pdf",
  bookmark: "bookmark",
  callout: "callout",
  quote: "blockquote",
  equation: "equation",
  divider: "hr",
  table_of_contents: "toc",
  column_list: "columns",
  column: "column",
  link_preview: "a",
  synced_block: "skip",
  template: "none",
  link_to_page: "link",
  table: "table",
  table_row: "tr",
  // "cell": "td", // not that way in API but makes little sense to me to not have cells as children
  unsupported: "none",
};
