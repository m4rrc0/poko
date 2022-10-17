import postcss from 'postcss';
import {
  getNotionPage,
  getAllNotionPages,
  getBlockChildren,
  rootId,
} from "@services/notion.mjs";
import postCssConfig from '@root/postcss.config.cjs'

export async function get() {
  let rootID = rootId();
  let root;
  const from = "dist/user-styles.css"

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
  
  let globalStylesString = globalStylesBlock?.code?.rich_text?.[0]?.plain_text || ''

  if (!globalStylesString) {
    console.warn("No global Styles found")
  }


  await postcss(postCssConfig.plugins).process(globalStylesString, { from, to: from }).then(result => {
    // console.log(result.css)
    globalStylesString = result.css
  })


  return {
    body: globalStylesString,
  };
}
