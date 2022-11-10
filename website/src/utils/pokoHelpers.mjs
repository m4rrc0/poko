// import { store } from "@services/notion.js";

export const pagesLevel1 = ({ components, poko, page, block }) => {
	const pages = poko.pages.filter(
		(p) => p.poko.page.status === 'published' && p.poko.page.parents?.length === 1
	);
	return pages;
};

export const test = () => ({ testValue: 'test' });
