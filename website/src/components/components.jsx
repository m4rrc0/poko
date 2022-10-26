import { h } from 'preact';
// import * as preact from "preact";
// import * as preactHooks from "preact/hooks";
import { visitParents } from 'unist-util-visit-parents';
// import { store } from "@services/notion.js";
import _get from 'lodash.get';
// import _merge from 'lodash.merge';
import deepmerge from 'deepmerge';
import { notionHelpers, simpleDeepMerge, isObject, joinStrings } from '@utils';
// import poko from "@poko";
import Anon from '@components/Anon.jsx';
// import { Img } from "astro-imagetools/components";
// import { renderImg } from "astro-imagetools/api";
// import * as userAssets from "../_data/*";

// const { settings } = poko;

// const getBlock = (tree, blockId) => {
// 	let _block;
// 	visitParents(
// 		tree,
// 		(node) => node.data.id === blockId,
// 		(node) => {
// 			_block = node;
// 		}
// 	);
// 	// We can get an 'undefined' collection object if User uses a DB view
// 	return _block;
// };
// const getCollection = ({ tree, blockId, collectionName }) => {
// 	let _collection;
// 	visitParents(
// 		tree,
// 		(node) => node.data.id === blockId,
// 		(node) => {
// 			visitParents(
// 				node,
// 				(_node) => _node.data.codeName === collectionName,
// 				(_node) => {
// 					_collection = _node;
// 				}
// 			);
// 		}
// 	);
// 	// We can get an 'undefined' collection object if User uses a DB view
// 	return _collection;
// };

export const addProps = (Component, defaultProps, key) => {
	if (typeof Component === 'function') {
		return (props) => <Component {...{ ...defaultProps, ...props }} />;
	} else if (typeof Component === 'string' && !!defaultProps.components[Component]) {
		if (/^[A-Z]/.test(Component)) {
			const Comp = defaultProps.components[Component];
			return (props) => <Comp {...{ ...defaultProps, ...props }} />;
		}
		return Component;
	} else {
		// withProps[key] = Component;
		return null;
	}
};

export const addPropsonComponents = (components, defaultProps) => {
	const withProps = {};

	for (let [key, Component] of Object.entries(components)) {
		if (Array.isArray(Component)) {
			withProps[key] = () => <>{Component.map((CompI) => addProps(CompI, defaultProps, key))}</>;
		} else if (typeof Component === 'object') {
			withProps[key] = addPropsonComponents(Component, defaultProps);
		} else {
			// NOTE: props here is the props passed to the element in md (ex: 'href' on <a>)
			withProps[key] = addProps(Component, defaultProps, key);
		}
	}

	return withProps;
};

const setClassIf = (str, components) => (components[str] ? { class: str } : {});

// TODO: LayoutBuilder can build any Layout
/*
Data (pass pokoProps by default)
  OuterWrapper (<Fragment> by default)
    Before
    Wrapper
      DefaultElement
        Content || children
      /
    /
    After
  /
*/
// const LayoutBuilder = (ap) => {
// 	return (
// 		<>
// 			{ap.components.HeaderBefore && <ap.components.HeaderBefore {...{ ...ap }} />}
// 			<ap.components.header {...{ ...setClassIf('Header', ap.components), ...ap }}>
// 				{ap.components.Header && <ap.components.Header {...{ ...ap }} />}
// 			</ap.components.header>
// 			{ap.components.HeaderAfter && <ap.components.HeaderAfter {...{ ...ap }} />}
// 		</>
// 	);
// };
const LayoutHeader = (ap) => (
	<>
		{ap.components.HeaderBefore && <ap.components.HeaderBefore {...{ ...ap }} />}
		<ap.components.header {...{ ...setClassIf('Header', ap.components), ...ap }}>
			{ap.components.Header && <ap.components.Header {...{ ...ap }} />}
		</ap.components.header>
		{ap.components.HeaderAfter && <ap.components.HeaderAfter {...{ ...ap }} />}
	</>
);
const LayoutMenu = (ap) => (
	<>
		{ap.components.MenuBefore && <ap.components.MenuBefore {...{ ...ap }} />}
		<ap.components.nav {...{ ...setClassIf('Menu', ap.components), ...ap }}>
			{ap.components.Menu && <ap.components.Menu {...{ ...ap }} />}
		</ap.components.nav>
		{ap.components.MenuAfter && <ap.components.MenuAfter {...{ ...ap }} />}
	</>
);
const LayoutContent = (ap) => (
	<>
		{ap.components.ContentBefore && <ap.components.ContentBefore {...{ ...ap }} />}
		{ap.children}
		{ap.components.ContentAfter && <ap.components.ContentAfter {...{ ...ap }} />}
	</>
);
const LayoutFooter = (ap) => (
	<>
		{ap.components.FooterBefore && <ap.components.FooterBefore {...{ ...ap }} />}
		<ap.components.footer {...{ ...setClassIf('Footer', ap.components), ...ap }}>
			{ap.components.Footer && <ap.components.Footer {...{ ...ap }} />}
		</ap.components.footer>
		{ap.components.FooterAfter && <ap.components.FooterAfter {...{ ...ap }} />}
	</>
);

// ???????? Implement sidebars like that ???????????
// const LayoutSidebarMain = (ap) => (
// 	<>
//     {ap.components.SidebarMainBefore && <ap.components.SidebarMainBefore {...{ ...ap }} />}
//     <ap.components.div {...{ ...setClassIf('SidebarMain', ap.components), ...ap }}>
//       {ap.components.SidebarMain && <ap.components.SidebarMain {...{ ...ap }} />}
//     </ap.components.div>
//     {ap.components.SidebarMainAfter && <ap.components.SidebarMainAfter {...{ ...ap }} />}
// 	</>
// );
// const LayoutSidebarContent = (ap) => (
// 	<>
//     {ap.components.SidebarContentBefore && <ap.components.SidebarContentBefore {...{ ...ap }} />}
//     <ap.components.div {...{ ...setClassIf('SidebarContent', ap.components), ...ap }}>
//       {ap.components.SidebarContent && <ap.components.SidebarContent {...{ ...ap }} />}
//     </ap.components.div>
//     {ap.components.SidebarContentAfter && <ap.components.SidebarContentAfter {...{ ...ap }} />}
// 	</>
// );
// const LayoutContent = (ap) => {
//   const hasSidebarContent =
// 		ap.components.SidebarContentBefore || ap.components.SidebarContent || ap.components.SidebarContentAfter;
//   const hasContentWrapper = !!ap.components.ContentWrapper
//   const ContentWrapper = ap.components.ContentWrapper || ap.components.LayoutContentWrapper || LayoutContentWrapper

//   return hasSidebarContent || hasContentWrapper ? (
//     <ContentWrapper {...{ ...ap }}>
//       {ap.components.ContentBefore && <ap.components.ContentBefore {...{ ...ap }} />}
//       {ap.children}
//       {ap.components.ContentAfter && <ap.components.ContentAfter {...{ ...ap }} />}
//     </ContentWrapper>
//   ) : (
//     <>
//       {ap.components.ContentBefore && <ap.components.ContentBefore {...{ ...ap }} />}
//       {ap.children}
//       {ap.components.ContentAfter && <ap.components.ContentAfter {...{ ...ap }} />}
//     </>
//   )
// };
// const LayoutMultiWrapper = ({children, tag = 'div', defaultClass, ...ap}) => {
//   const className = [defaultClass, ap.class].filter(z => z).join(' ')
//   return (
//   	<Element {...{ tag, ...ap, class: className }}>{children}</Element>
//   )
// }
// const LayoutMainWrapper = (ap) => LayoutMultiWrapper({ defaultClass: 'MainWrapper', ...ap })
// const LayoutContentWrapper = (ap) => LayoutMultiWrapper({ defaultClass: 'ContentWrapper', ...ap })

const wrapper = ({ children, components, poko, page, block, ...props }) => {
	const pokoProps = { components, poko, page, block };
	const allProps = { ...pokoProps, ...props };
	// const hasSidebarMain =
	// 	components.SidebarMainBefore || components.SidebarMain || components.SidebarMainAfter;

	return (
		<>
			{/* Main Nav = Menu */}
			<LayoutMenu {...{ ...allProps }} />

			{/* Main */}
			{components.MainBefore && <components.MainBefore {...{ ...allProps }} />}
			<components.main {...{ ...allProps }}>
				{/* Header */}
				<LayoutHeader {...{ ...allProps }} />

				{/* Content of page */}
				<LayoutContent {...{ children, ...allProps }} />
			</components.main>
			{components.MainAfter && <components.MainAfter {...{ ...allProps }} />}

			{/* Footer */}
			<LayoutFooter {...{ ...allProps }} />
		</>
	);
};

const ImgLazy = ({
	children,
	components,
	poko,
	page,
	block,
	src,
	alt = '',
	width,
	height,
	onload,
}) => {
	return (
		<E.div {...{ components, poko, page, block, class: 'img-lazy-wrapper' }}>
			<E.img
				{...{
					components,
					poko,
					page,
					block,
					src,
					alt,
					loading: 'lazy',
					width,
					height,
					// ..._img,
					class: `img-lazy`,
					onload: `this.parentNode.style.backgroundColor = 'transparent';this.style.opacity = 1;${
						onload || ''
					}`,
				}}
			/>
		</E.div>
	);
};

const NavPicoCss = ({ index, pages }) => {
	return (
		<nav class="container">
			<ul>
				{index && index.title && (
					<li>
						<strong>
							<a href={index.href}>{index.title}</a>
						</strong>
					</li>
				)}
			</ul>

			<ul>
				{pages &&
					pages.map(({ href, title, codeName }) => (
						<li>
							<a {...{ href }}>{title || codeName}</a>
						</li>
					))}
			</ul>
		</nav>
	);
};

const Nav = ({ index, pages }) => {
	return (
		<nav>
			<ul>
				{index && index.title && (
					<li>
						<strong>
							<a href={index.href}>{index.title}</a>
						</strong>
					</li>
				)}
			</ul>
			<ul>
				{pages &&
					pages.map(({ href, title, codeName }) => (
						<li>
							<a {...{ href }}>{title || codeName}</a>
						</li>
					))}
			</ul>
		</nav>
	);
};

// const CollectionWrapper = (props) => <div class="grid" {...props} />;
const CollectionWrapper = ({ children, ...props }) => {
	return (
		<E.div
			{...{ ...props, class: 'CollectionWrapper'.concat(props?.class ? ` ${props?.class}` : '') }}
		>
			{children}
		</E.div>
	);
};
const CollectionArticle = ({ components, poko, page, block, children }) => {
	return (
		<E.article
			{...{
				poko,
				page,
				block,
				['data-id']: poko.block.id,
				// class: "box shadowy",
				class: 'CollectionArticle',
			}}
		>
			{children}
		</E.article>
	);
};
const CollectionArticleFeaturedImage = ({ components, poko, page, block, featuredImage }) => {
	// console.log({ featuredImage });
	const fi = featuredImage?.[0] || featuredImage;
	return fi ? (
		<components.ImgLazy
			{...{ components, poko, page, block, class: 'CollectionArticleFeaturedImage', ...fi?.image }}
		/>
	) : null;
};
const CollectionArticleHeading = ({ components, poko, page, block, href, title, tag = 'h2' }) => {
	const El = E[tag] || E.h2;
	return href && title ? (
		<El {...{ components, poko, page, block, class: 'CollectionArticleHeading' }}>
			<E.a {...{ components, poko, page, block, href, title, class: `CollectionArticleHeadingA` }}>
				{title}
			</E.a>
		</El>
	) : null;
};
const CollectionArticleFooter = ({ components, poko, page, block, datePublished, author }) => {
	return datePublished || author ? (
		<E.div {...{ components, poko, page, block, class: 'CollectionArticleFooter' }}>
			{datePublished ? (
				<E.p {...{ components, poko, page, block }}>
					On <time datetime={datePublished}>{datePublished}</time>
				</E.p>
			) : null}
			{author ? <E.p {...{ components, poko, page, block }}>by {author}</E.p> : null}
		</E.div>
	) : null;
};
// const ColumnsWrapper = (props) => <div class="grid" {...props} />;
// const Col = ({ ...block }) => {
//   const md = block?.data?.md;
//   console.log(block);
//   // console.log(props);
//   return <div>{md}</div>;
// };

const HeaderBlog = ({ components, poko, page, block, ...props }) => {
	const ld = page.jsonld || {};
	const featuredImage = page.featuredImage || ld.image?.[0] || ld.image;
	const author = page.author || ld.author?.name;
	const datePublished = page.datePublished || ld.datePublished?.start;

	// console.log({ featuredImage })

	return (
		<components.header
			{...{ components, poko, page, block, class: 'stack', style: 'gap-stack: 1rem;' }}
		>
			{featuredImage ? (
				<components.img {...{ components, poko, page, block, ...featuredImage.image }} />
			) : null}
			{datePublished || author ? (
				<components.div
					{...{ components, poko, page, block, class: 'cluster', style: '--gap-cluster: 1ch;' }}
				>
					{datePublished ? (
						<components.p {...{ components, poko, page, block }}>
							On <time datetime={datePublished}>{datePublished}</time>
						</components.p>
					) : null}
					{author ? (
						<components.p {...{ components, poko, page, block }}>by {author}</components.p>
					) : null}
				</components.div>
			) : null}
			{page.title && <h1>{page.title}</h1>}
			<hr />
		</components.header>
	);
};

const HeaderProduct = ({ components, poko, page, block, ...props }) => {
	const pokoProps = { components, poko, page, block };
	console.log({ poko, page, block, ...props });
	const { title, description, jsonld, gallery, price, _definition } = page || {};
	const { canonicalUrl } = poko.page;
	const ld = jsonld || {};
	const featuredImage = page.featuredImage?.[0] || page.featuredImage || ld.image?.[0] || ld.image;
	const author = page.author || ld.author?.name;
	const datePublished = page.datePublished || ld.datePublished?.start;
	const ID = page.id || page.ID || page.sku || page.title || poko.page.id;
	const priceSymbol = _definition?.price?.number?.format === 'euro' ? '€' : '?';

	// console.log({ featuredImage })

	return (
		title && (
			<div class="with-sidebar right" style="--side-width: 25rem; --content-min: 30%;">
				<div>
					<div class="stack">
						{featuredImage ? <components.ImgLazy {...{ ...pokoProps, ...featuredImage }} /> : null}
						{gallery?.[0] && (
							<div class="grid" style="--width-column: 4rem;">
								<div>
									{gallery.map((i) => (
										<components.ImgLazy {...{ ...i }} />
									))}
								</div>
							</div>
						)}
					</div>
					<div>
						<components.header {...{ ...pokoProps, ...props }}>
							{title && <h1>{title}</h1>}
						</components.header>
						{price && (
							<div class="cluster">
								<div>
									<p style="font-size: 1.17rem;">
										{price}
										{priceSymbol}
									</p>
									<button
										class="snipcart-add-item"
										data-item-name={title}
										data-item-id={ID}
										data-item-price={price}
										data-item-description={description}
										data-item-image={featuredImage.url}
										data-item-url={canonicalUrl.href}
										data-item-has-taxes-included
									>
										Ajouter au panier
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	);

	return (
		<components.header
			{...{ components, poko, page, block, class: 'stack', style: 'gap-stack: 1rem;' }}
		>
			{featuredImage ? (
				<components.img {...{ components, poko, page, block, ...featuredImage.image }} />
			) : null}
			{datePublished || author ? (
				<components.div
					{...{ components, poko, page, block, class: 'cluster', style: '--gap-cluster: 1ch;' }}
				>
					{datePublished ? (
						<components.p {...{ components, poko, page, block }}>
							On <time datetime={datePublished}>{datePublished}</time>
						</components.p>
					) : null}
					{author ? (
						<components.p {...{ components, poko, page, block }}>by {author}</components.p>
					) : null}
				</components.div>
			) : null}
			{page.title && <h1>{page.title}</h1>}
			<hr />
		</components.header>
	);
};

const Null = () => null;
const BlockToPage = ({ components, poko, page, block }) => (
	<E.a {...{ components, poko, page, block, href: block.poko.page.href }}>{block.page.title}</E.a>
);
// NOTE: For classes, use "blockName-elemName_modName_modVal" ??

const Element = ({
	tag,
	children,
	subSelectors,
	class: className,
	components,
	poko,
	page,
	block,
	...rest
}) => {
	if (!tag) return null;

	// console.log(tag, page);

	const notionId = rest?.['data-id'];
	const pokoProps = { components, poko, page, block };
	// const subBlocks = { ...page?.subBlocks, page }

	const classNames = typeof className === 'string' ? className?.split(' ') : [];
	let ss = ['all', tag, ...classNames, notionId];
	if (typeof subSelectors === 'string') ss.push(subSelectors);
	else if (Array.isArray(subSelectors)) ss.push(...subSelectors);

	const blockPropsFromPageArr = ss
		.map((subPropsPath) => page.subBlocks?.[subPropsPath])
		.filter((z) => z);
	const blockPropsFromPage = blockPropsFromPageArr[blockPropsFromPageArr.length - 1] || {};

	// const props = deepmerge(rest, blockPropsFromPage);
	const props = { ...rest, ...blockPropsFromPage };
	// const props = {}

	const classMerged = [
		typeof className === 'string' && className,
		typeof blockPropsFromPage.class === 'string' && blockPropsFromPage.class,
	]
		.filter((z) => z)
		.join(' ');

	// return ({ children, components, poko, page, block, ...props }) => <Anon {...{ tag: 'main', ...props }}>{children}</Anon>
	return (
		<Anon {...{ tag, ...props, ...(classMerged ? { class: classMerged } : {}) }}>{children}</Anon>
	);
};

const Component = ({
	tag,
	children,
	subSelectors,
	class: className = '',
	components,
	poko,
	page,
	block,
	...rest
}) => {
	// const { _self, _page, _pages, metadata, subPages, title, presets, status, ...rest } = restRaw
	const Comp = components[tag];
	if (!Comp) return null;

	const pokoProps = { components, poko, page, block };

	const classNames = typeof className === 'string' ? className?.split(' ') : [];
	let as = ['all', tag, ...classNames];
	if (typeof subSelectors === 'string') as.push(subSelectors);
	else if (Array.isArray(subSelectors)) as.push(...subSelectors);

	const blockPropsFromPageArr = as
		.map((subPropsPath) => page.subBlocks?.[subPropsPath])
		.filter((z) => z);
	const blockPropsFromPage = blockPropsFromPageArr[blockPropsFromPageArr.length - 1] || {};
	// const props = deepmerge(rest, blockPropsFromPage);
	const props = { ...rest, ...blockPropsFromPage };
	// const props = {}

	const classMerged = [
		typeof className === 'string' && className,
		typeof blockPropsFromPage.class === 'string' && blockPropsFromPage.class,
	]
		.filter((z) => z)
		.join(' ');

	return <Comp {...{ ...pokoProps, ...props, class: classMerged, children }} />;
};

// prettier-ignore
const elementsTags = ['div','a','blockquote','br','code','em','h1','h2','h3','h4','h5','h6','hr','img','li','ol','p','pre','strong','ul',
  // With remark-gfm (see guide) you can also use:
  'del','input','section','sup','table','tbody','td','th','thead','tr',
	// Other normal elements
  'main','footer','header','aside','article','nav','label','form',]

const E = elementsTags.reduce(
	(prev, curr) => ({
		...prev,
		[curr]: ({ children, ...props }) => <Element {...{ tag: curr, ...props }}>{children}</Element>,
	}),
	{}
);

// NOTE on how to use and abuse components:
//    in props, elements should only be reassigned with other elements
//    elements will not render if they don't have either some props or ome inner content
//    other components (in Pascal Case) can be created, modified, reassigned
//  ?? Should I account for components for big blocks like I did for <compoents.footer><components.Footer /></compoents.footer>
//  -> Means I can create footer content in many ways: page _Footer, export components.Footer which can even return an array, ...
const components = {
	Null,
	BlockToPage,
	Component,
	C: Component,
	Element,
	E,
	...E,

	// --- SPECIAL COMPONENTS --- //
	wrapper,
	Layout: wrapper,
	wrapperComponentFromPage: ({ children, components, poko, page, block, ...props }) => {
		return children;
	},
	// Poko,
	// Preact,
	ImgLazy,
	NavPicoCss,
	Nav,
	// PagesLevel1Data: ({ children, components, poko, page, block, Child }) => {
	// 	const pokoProps = { components, poko, page, block };
	// 	const topLevelPages = poko.pages.filter(
	// 		(p) => p.poko.page.status === 'published' && p.poko.page.parents?.length === 1
	// 	);
	//   return Child({ children, components, poko, page, block: { pages: topLevelPages } })
	// },
	// PagesLevel1: () => null,
	MenuLevel1Pages: ({ children, components, poko, page, block }) => {
		const pokoProps = { components, poko, page, block };
		const topLevelPages = poko.pages.filter(
			(p) => p.poko.page.status === 'published' && p.poko.page.parents?.length === 1
		);

		const index = topLevelPages?.find((p) => p.poko.page.codeName === 'index');
		const pages = topLevelPages?.filter((p) => p.poko.page.codeName !== 'index');

		return (
			<components.nav {...{ class: 'Menu', ...pokoProps }}>
				<components.div {...{ class: 'Menu-left', ...pokoProps }}>
					{index && (index.page.titleMenu || index.page.title) && (
						<components.a
							{...{
								href: index.poko.page.href,
								class: 'Menu-left-a',
								children: index.page.titleMenu || index.page.title,
								...pokoProps,
							}}
						/>
					)}
				</components.div>
				<components.ul {...{ class: 'Menu-right', ...pokoProps }}>
					{pages &&
						pages.map(
							({
								page: { title, titleMenu },
								poko: {
									page: { href, codeName },
								},
							}) => (
								<components.li {...{ class: 'Menu-right-item', ...pokoProps }}>
									<components.a
										{...{
											href,
											class: 'Menu-right-a',
											children: titleMenu || title || codeName,
											...pokoProps,
										}}
									/>
								</components.li>
							)
						)}
				</components.ul>
			</components.nav>
		);
	},
	ChildPageData: ({ components, poko, page, block, blockRaw }) => {
		const codeName = blockRaw.child_page.title;
		const parentPageId = poko.page.id;

		const childPage = poko.pages.find(({ poko, page, block }) => {
			const currentParents = poko?.page?.parents;
			const lastParentId = currentParents?.[currentParents?.length - 1]?.id;
			return poko.page.codeName === codeName && parentPageId === lastParentId;
		});

		return components.ChildPage({ components, poko, page, block: childPage });
	},
	ChildPage: Null,
	LinkToPageData: ({ components, poko, page, block, blockRaw }) => {
		const linkedPageId = blockRaw?.link_to_page?.page_id || blockRaw?.link_to_page?.database_id;
		const linkedPage = poko.pages.find(({ poko, page, block }) => poko.page.id === linkedPageId);
		return components.LinkToPage({ components, poko, page, block: linkedPage });
	},
	LinkToPage: BlockToPage,
	CollectionData: ({ components, poko, page, block, blockRaw }) => {
		const pokoProps = { components, poko, page, block };
		// NOTE: receives special prop: blockRaw
		// const blockId = blockRaw.id
		const parentPageId = blockRaw.parent?.page_id || blockRaw.parent?.collection_id;
		const collectionName = blockRaw.child_database?.title;
		const collectionItems = poko.pages.filter(({ poko, page, block }) => {
			const parentsLength = poko.page.parents?.length;
			return (
				poko.page.parents?.[parentsLength - 1]?.codeName === collectionName &&
				poko.page.parents?.[parentsLength - 2]?.id === parentPageId &&
				poko.page.status === 'published'
			);
		});

		return collectionItems.length ? (
			<components.CollectionWrapper {...{ ...pokoProps }}>
				{collectionItems.map(({ poko, page, block }) => {
					const pokoPropsItem = {
						...pokoProps,
						block: page,
					};
					pokoPropsItem.poko.block = poko.page;

					const ld = page.jsonld || {};
					const featuredImage = page.featuredImage || ld.image?.[0] || ld.image;
					const author = page.author || ld.author?.name || ld.author;
					const datePublished =
						page.datePublished?.start ||
						page.datePublished ||
						ld.datePublished?.start ||
						ld.datePublished;
					const dateModified =
						page.dateModified?.start ||
						page.dateModified ||
						ld.dateModified?.start ||
						ld.dateModified;
					const title = page.title?.string || page.title;

					// console.log({
					//   propsItem,
					//   author,
					//   datePublished,
					//   // components
					//   featuredImage,
					// });

					return page ? (
						<components.CollectionArticle
							{...{
								...pokoPropsItem,
								featuredImage,
								href: poko.page.href,
								title,
								datePublished,
								author,
							}}
						>
							<components.CollectionArticleFeaturedImage {...{ ...pokoPropsItem, featuredImage }} />
							<components.CollectionArticleHeading
								{...{
									...pokoPropsItem,
									href: poko.page.href,
									title,
								}}
							/>
							<components.CollectionArticleFooter
								{...{ ...pokoPropsItem, datePublished, author }}
							/>
						</components.CollectionArticle>
					) : null;
				})}
			</components.CollectionWrapper>
		) : null;
	},
	CollectionWrapper,
	CollectionArticle,
	CollectionArticleFeaturedImage,
	CollectionArticleHeading,
	CollectionArticleFooter,
	CollectionPageHeader: ({ components, poko, page, block, ...props }) => {
		const pokoProps = { components, poko, page, block };
		const allProps = { ...pokoProps, ...props };

		const ld = page.jsonld || {};
		const featuredImage = page.featuredImage || ld.image?.[0] || ld.image;
		const author = page.author || ld.author.name;
		const datePublished = page.datePublished || ld.datePublished?.start;

		return (
			<components.header {...{ ...allProps, class: 'stack', style: '--gap-stack: 1rem;' }}>
				{featuredImage ? <components.ImgLazy {...{ ...allProps, ...featuredImage.image }} /> : null}
				{datePublished || author ? (
					<components.div {...{ ...allProps, class: 'cluster', style: '--gap-cluster: 1ch;' }}>
						{datePublished ? (
							<components.p {...{ ...allProps }}>
								On <time datetime={datePublished}>{datePublished}</time>
							</components.p>
						) : null}
						{author ? <components.p {...{ ...allProps }}>by {author}</components.p> : null}
					</components.div>
				) : null}
				{/* Element does not render if no child and no props AND grabs subBlocks */}
				<E.h1 {...{ ...allProps }}>{page.title}</E.h1>
				<hr />
			</components.header>
		);
	},
	SearchBar: ({
		components,
		poko,
		page,
		block,
		collectionId,
		id,
		placeholder = 'search',
		searchbar, // useful if some properties are defined on the page level
	}) => {
		const collectionIdNoHyphens = collectionId.replaceAll('-', '');
		const items = poko.pages.filter(({ poko, page, block }) => {
			const lastParent = poko.page.parents?.[poko.page.parents?.length - 1];
			return lastParent?.id?.replaceAll('-', '') === collectionIdNoHyphens;
		});
		// const scriptId = `searchbar-script-${collectionId}${id ? `-${id}` : ""}`;
		const styleId = `searchbar-style-${collectionId}${id ? `-${id}` : ''}`;
		const inputId = `searchbar-input-${collectionId}${id ? `-${id}` : ''}`;

		if (!items?.length) return null;

		// const [inputTerm, setInputTerm] = preactHooks.useState("");

		// const stylesForChildren = preactHooks.useMemo(() => {
		//   const doNotMatchSelector = collection.children
		//     .filter((article) => {
		//       // const { id, status, codeName, props } = article?.data || {}
		//       // console.log(article);
		//       if (article?.data?.codeName.match(inputTerm)) {
		//         return false;
		//       }
		//       return true;
		//     })
		//     .map((child) => `[data-id="${child.data.id}"]`)
		//     .join(",");

		//   return doNotMatchSelector ? `${doNotMatchSelector}{display: none;}` : "";
		// }, [inputTerm, collection.children]);

		// const childrenMatchingArray = collection.children?.map((child) => {
		//   const str = [child.data.codeName].join(" ").toLowerCase();
		//   return {
		//     id: child.data.id,
		//     str,
		//   };
		// });

		const matchingItems = items?.map((item) => {
			const str = [item.codeName].join(' ').toLowerCase();
			return {
				id: item.id,
				str,
			};
		});

		return (
			<>
				<style
					id={styleId}
					// dangerouslySetInnerHTML={{
					//   __html: stylesForChildren,
					// }}
				/>
				<components.div {...{ components, poko, page, block, ...searchbar, class: 'searchbar' }}>
					{placeholder && (
						<components.label
							{...{
								components,
								poko,
								page,
								block,
								htmlFor: inputId,
								style: {
									position: 'absolute',
									left: '-10000px',
									top: 'auto',
									width: 1,
									height: 1,
									overflow: 'hidden',
								},
							}}
						>
							{placeholder || ''}
						</components.label>
					)}
					<components.input
						{...{
							components,
							poko,
							page,
							block,
							id: inputId,
							name: 'search',
							type: 'text',
							placeholder: placeholder || '',
							// value={inputTerm}
							// onInput={(e) => {
							//   console.log(e);
							//   setInputTerm(e.target.value);
							// }}
							['data-matching-array']: JSON.stringify(matchingItems),
							oninput: `
                const stylesEl = document.getElementById("${styleId}");
  
                const val = this.value.toLowerCase();
                const matchingArray = JSON.parse(this.dataset.matchingArray);
                const doNotMatchSelector = matchingArray
                  .filter(({str}) => !str.match(val))
                  .map(({id}) => '[data-id="' + id + '"]')
                  .join(",");
                
                stylesEl.innerHTML = doNotMatchSelector ? doNotMatchSelector + '{display: none;}' : '';
              `,
						}}
					/>
					{/* <script
            id={scriptId}
            dangerouslySetInnerHTML={{
              __html: `
            const source = document.getElementById('${inputId}');
            // const result = document.getElementById('result');

            const inputHandler = function(e) {
              console.log(e.target.value)
              // result.innerHTML = e.target.value;
            }

            source.addEventListener('input', inputHandler);
            source.addEventListener('propertychange', inputHandler); // for IE8
            `,
            }}
          /> */}
				</components.div>
			</>
		);
	},
	HeaderTitle: ({ components, poko, page, block, ...props }) => {
		const pokoProps = { components, poko, page, block };
		const allProps = { ...pokoProps, ...props };
		// Element does not render if no child and no props AND grabs subBlocks
		return <E.h1 {...{ ...allProps }}>{page.title}</E.h1>;
	},
	HeaderBlog,
	HeaderProduct,
	// Columns: () => <div>Hello Columns</div>,
	// Columns: ({ blockId }) => {
	//   const block = getBlock(websiteTree, blockId);
	//   return block?.children?.length ? (
	//     <ColumnsWrapper>
	//       {block.children.map((c) => (
	//         <Col {...c} />
	//       ))}
	//     </ColumnsWrapper>
	//   ) : null;
	// },
	// ColumnsWrapper,
	// Col,
	// Column: () => null,
	//
	// Test: () => {
	//   return (
	//     <Poko>{({ poko }) => <div>{poko?.pages?.[1]?.data?.codeName}</div>}</Poko>
	//   );
	// },
};

export default components;
