import { Client } from "@notionhq/client";
import "dotenv/config";
import { NotionToMarkdown } from "notion-to-md";
import { getImage, getPicture } from "@astrojs/image";
import probeImageSize from "probe-image-size";

const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
const NOTION_ROOT_ID = import.meta.env.NOTION_ROOT_ID;
// Initializing notion client
const notion = new Client({ auth: NOTION_TOKEN });

// NotionToMarkdown: passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

n2m.setCustomTransformer("image", async (block) => {
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
  console.log({ type });
  const i = await getImage({
    src: originalUrl,
    format: type,
    width,
    height,
    alt,
  });
  console.log({ i });
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

n2m.setCustomTransformer("toggle", async (block) => {
  return "";
  // const { toggle } = block;
  // // console.log(toggle);
  // let toggle_text = "";
  // toggle.rich_text.forEach((rich_text) => {
  //   toggle_text += n2m.annotatePlainText(
  //     rich_text.plain_text,
  //     rich_text.annotations
  //   );
  // });
  // return toggle_text;
});

n2m.setCustomTransformer("child_page", async (block) => {
  const { child_page } = block;
  // console.log(block);
  return `<ChildPage block={${JSON.stringify(block)}} />`;
});

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

async function getBlockChildren(block_id = NOTION_ROOT_ID) {
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

      if (block.object !== "page") {
        const _inlineMd = await notionBlockToMd(_block);
        const _mayHaveNotionLink = !!_inlineMd.match(/\/[0-9a-z\-]{32}/);
        block = { ..._block, _inlineMd, parent: _inlineMd, _mayHaveNotionLink };
      }

      //   let blockId;
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
              return p._parentId === currentPageId;
            });

          let subChildren = [];
          if (pages[0].object === "database") {
            // TODO: might be an inline DB or just a subPage...
            subChildren = allPages.filter((p) => {
              return p._parentId === pages[0].id;
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

      return { ...block, _parentPageId: currentPageId, children };
    })
  );

  // allPages.forEach((p) => {
  //   console.log({ properties: p.properties, props: p._props });
  // });

  return blocks;

  //   return { blocksCopy: bc, blocks: blocksPopulated };
}

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
        return p._codeName === childPageTitle;
      })
      .filter((p) => {
        return p._parentId === _block._parentPageId;
      })[0];

    // console.log(`Injecting page with childPage ${childPage._codeName}`);

    let subChildren;
    if (childPage.object === "database") {
      // TODO: might be an inline DB or just a subPage...
      subChildren = allRawPages.filter((p) => {
        if (p._parentId === childPage.id) {
          // console.log(`Injecting page in DB ${childPage._codeName}`);
        }
        return p._parentId === childPage.id;
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
    // .toMarkdownString(mdBlocks)
    .toMarkdownString(blocks)
    .trim() // trim() to remove leading (and trailing) "\n" to allow top level frontmatter
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
