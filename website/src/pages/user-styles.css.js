import {
  getNotionPage,
  getAllNotionPages,
  getBlockChildren,
  rootId,
} from "@services/notion.mjs";

export async function get() {
  let rootID = rootId();
  let root;

  if (rootID) {
    // root = await getNotionPage(rootID);
  } else {
    let allRawPages = await getAllNotionPages();
    // Find root of website
    root = allRawPages.find((p) => p?.parent?.type === "workspace");
    rootID = root?.id;
  }

  if (!rootID) {
    throw "No settings page found.\nHave you shared your Notion pages with your integration?";
  }

  const blocks = await getBlockChildren(rootID)
  const globalStylesBlock = blocks.find(b => b?.code?.language === 'css')
  
  const globalStylesString = globalStylesBlock?.code?.rich_text?.[0]?.plain_text || ''

  if (!globalStylesString) {
    console.warn("No global Styles found")
  }

  return {
    body: globalStylesString,
  };
}
