import { getNotionPage, getAllNotionPages, getBlockChildren, rootId } from '@services/notion.mjs';

export const get = ({ params, props, request }) => {
	// const filename = params.filename;
	// const url = request.url;

	return {
		body: props.body,
	};
};

export async function getStaticPaths() {
	let rootID = rootId();
	let root;

	if (rootID) {
		// root = await getNotionPage(rootID);
	} else {
		let allRawPages = await getAllNotionPages();
		// Find root of website
		root = allRawPages.find((p) => p?.parent?.type === 'workspace');
		rootID = root?.id;
	}

	if (!rootID) {
		throw 'No settings page found.\nHave you shared your Notion pages with your integration?';
	}

	const blocks = await getBlockChildren(rootID);
	const plainTextBlocksAsStrings = blocks
		.filter((b) => b?.code?.language === 'plain text')
		.map((b) => b?.code?.rich_text?.[0]?.plain_text || '');
	const redirectsString = plainTextBlocksAsStrings.find((b) => b.startsWith('# /_redirects')) || '';

	if (!redirectsString) {
		console.info('No redirects defined');
	}

	return [{ params: { filename: '_redirects' }, props: { body: redirectsString } }];
}
