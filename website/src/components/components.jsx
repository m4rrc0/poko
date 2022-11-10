import { h, Fragment } from 'preact';
// import * as preact from "preact";
// import * as preactHooks from "preact/hooks";
import { visitParents } from 'unist-util-visit-parents';
// import { store } from "@services/notion.js";
import _get from 'lodash.get';
// import _merge from 'lodash.merge';
import deepmerge from 'deepmerge';
import {
	notionHelpers,
	simpleDeepMerge,
	isObject,
	mergeClasses,
	computeDataFromHelper,
} from '@utils';
// import poko from "@poko";
import Anon from '@components/Anon.jsx';
// import { Img } from "astro-imagetools/components";
// import { renderImg } from "astro-imagetools/api";
// import * as userAssets from "../_data/*";

let Content;
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

const pageToLinkData = (pageProps) => {
	const {
		page: { title, titleLink, titleMenu },
		poko: {
			page: { href, codeName },
		},
	} = pageProps;
	const target = href.startsWith('/') ? '' : '_blank';

	return {
		children: titleLink || titleMenu || title || codeName,
		href,
		...(target ? { target } : {}),
		...pageProps,
	};
};

export const addProps = (Component, defaultProps, fromObjDef) => {
	if (Component == null) {
		return Component;
	} else if (typeof Component === 'function') {
		// NOTE: props here may be the props passed to the element in md (ex: 'href' on <a>)
		return (props) => <Component {...{ ...defaultProps, ...props }} />;
	} else if (typeof Component === 'string' && !!defaultProps.components[Component]) {
		if (/^[A-Z]/.test(Component)) {
			// console.log(Component);

			// if (Component === 'Top') console.log(Component, defaultProps);
			let Comp = defaultProps.components[Component];
			while (typeof Comp !== 'function') {
				Comp = addProps(Comp, defaultProps);
			}
			// console.log(Comp);
			return (props) => <Comp {...{ ...defaultProps, ...props }} />;
		}
		return Component;
	} else if (Array.isArray(Component)) {
		// Usefull for a list of children
		// return () => <>{Component.map((CompI) => addProps(CompI, defaultProps))}</>;
		return () => (
			<Fragment>
				{Component.map((CompI) => {
					const ArrElem = addProps(CompI, defaultProps);
					// console.log({ CompI, ArrElem });
					return typeof ArrElem === 'function' ? <ArrElem /> : ArrElem;
				})}
			</Fragment>
		);
	} else if (typeof Component === 'object') {
		if (Component.hasOwnProperty('component')) {
			// Usefull if directly passing a component definition (as object)
			// const { component, childrenComponents, ...restComponent } = Component;
			// const Children = childrenComponents ? addProps(childrenComponents, defaultProps) : undefined;
			// return addProps(component, {
			// 	...defaultProps,
			// 	...restComponent,
			// 	...(Children ? { children: <Children /> } : {}),
			// });
			const { component, children, ...restComponent } = Component;
			const Children = children == null ? children : addProps(children, defaultProps);

			return addProps(
				component,
				{
					...defaultProps,
					...restComponent,
					...(Children == null
						? {}
						: { children: typeof Children === 'function' ? <Children /> : Children }),
				},
				true
			);
		} else if (
			typeof Component.type === 'function' &&
			Component.hasOwnProperty('props') &&
			Component.hasOwnProperty('__self')
		) {
			// console.log(typeof Component, Component);
			// Should be a Preact component already
			// return <Component {...defaultProps} />;
			return () => Component;
		}
	} else if (Component === 'Content') {
		return () => Content;
	} else {
		// withProps[key] = Component;
		// return null;
		return fromObjDef ? null : Component;
	}
};

export const addPropsOnComponents = (components, defaultProps) => {
	const withProps = {};

	for (let [key, Component] of Object.entries(components)) {
		// console.log(typeof Component);
		if (Component == null) {
			// is undefined or null
			withProps[key] = Component;
		} else if (Array.isArray(Component)) {
			// console.log(Component);
			// withProps[key] = () => <>{Component.map((CompI) => addProps(CompI, defaultProps))}</>;
			withProps[key] = addProps(Component, defaultProps);
		} else if (typeof Component === 'object') {
			if (Component.hasOwnProperty('component')) {
				// A component with passed props
				withProps[key] = addProps(Component, defaultProps);
			} else {
				// this case is for nested components object. Ex: components = { Themes: { Light, Dark } }
				withProps[key] = addPropsOnComponents(Component, defaultProps);
			}
		} else {
			withProps[key] = addProps(Component, defaultProps);
		}
	}

	// console.log('components.CollectionArticleFooter: ', components.CollectionArticleFooter);
	// console.log('withProps.CollectionArticleFooter: ', withProps.CollectionArticleFooter);
	// console.log('defaultProps: ', defaultProps);

	return withProps;
};

// export const addPropsOnComponents = (components, defaultProps) => {
// 	const withProps = {};

// 	for (let [key, Component] of Object.entries(components)) {
// 		// console.log(typeof Component);
// 		if (Component == null) {
// 			// is undefined or null
// 			withProps[key] = Component;
// 			// } else if (Array.isArray(Component)) {
// 			// 	withProps[key] = addProps(Component, defaultProps);
// 		} else if (typeof Component === 'object') {
// 			if (
// 				typeof Component.type === 'function' &&
// 				Component.hasOwnProperty('props') &&
// 				Component.hasOwnProperty('__self')
// 			) {
// 				withProps[key] = (props) => Component;
// 			} else {
// 				// this case is for nested components object. Ex: components = { Themes: { Light, Dark } }
// 				withProps[key] = addPropsOnComponents(Component, defaultProps);
// 			}

// 			// } else if (typeof Component === 'object') {
// 			// 	if (Component.hasOwnProperty('component')) {
// 			// 		// A component with passed props
// 			// 		withProps[key] = addProps(Component, defaultProps);
// 			// 	} else {
// 			// 		// this case is for nested components object. Ex: components = { Themes: { Light, Dark } }
// 			// 		withProps[key] = addPropsOnComponents(Component, defaultProps);
// 			// 	}
// 		} else {
// 			// withProps[key] = addProps(Component, defaultProps);
// 			// console.log(Component);
// 			withProps[key] = (props) => <Component {...{ ...defaultProps, ...props }} />;
// 		}
// 	}

// 	return withProps;
// };

// export const retreiveComponent = (Component, components, fromObjDef) => {
// 	// Can return a function (=Preact component) or null or a random string
// 	let CompRetrieved;
// 	if (Component == null) {
// 		// This is meant to capture null values because it would be recognized as object below otherwise
// 		CompRetrieved = Component;
// 	} else if (typeof Component === 'function') {
// 		CompRetrieved = Component;
// 	} else if (typeof Component === 'string' && !!components[Component]) {
// 		CompRetrieved = components[Component] || Component;
// 		// if (/^[A-Z]/.test(Component)) {
// 		// 	CompRetrieved = components[Component];
// 		// 	// console.log(Component);
// 		// }
// 		// CompRetrieved = Component;
// 	} else if (Array.isArray(Component)) {
// 		// Usefull for a list of children
// 		// return () => <>{Component.map((CompI) => retreiveComponent(CompI, defaultProps))}</>;
// 		CompRetrieved = () => (
// 			<Fragment>
// 				{Component.map((CompI) => {
// 					let ArrElem = retreiveComponent(CompI, components);
// 					// while (typeof ArrElem !== 'function' || (ArrElem == null)) {
// 					// 	ArrElem = retreiveComponent(ArrElem, components);
// 					// }
// 					// console.log({ CompI, ArrElem });
// 					return typeof ArrElem === 'function' ? <ArrElem /> : ArrElem;
// 				})}
// 			</Fragment>
// 		);
// 	} else if (typeof Component === 'object') {
// 		if (Component.hasOwnProperty('component')) {
// 			// Usefull if directly passing a component definition (as object)
// 			// const { component, childrenComponents, ...restComponent } = Component;
// 			// const Children = childrenComponents ? retreiveComponent(childrenComponents, defaultProps) : undefined;
// 			// return retreiveComponent(component, {
// 			// 	...defaultProps,
// 			// 	...restComponent,
// 			// 	...(Children ? { children: <Children /> } : {}),
// 			// });
// 			const { component, children, ...restComponent } = Component;
// 			const Children = children == null ? children : retreiveComponent(children, components);
// 			console.log({ children, Children });

// 			CompRetrieved = retreiveComponent(component, components, true);
// 			console.log({ CompRetrieved });

// 			CompRetrieved =
// 				typeof CompRetrieved !== 'function'
// 					? CompRetrieved
// 					: () => (
// 							<CompRetrieved
// 								{...{
// 									...restComponent,
// 									...(Children == null
// 										? {}
// 										: { children: typeof Children === 'function' ? <Children /> : Children }),
// 								}}
// 							/>
// 					  );

// 			console.log({ CompRetrieved });
// 		} else if (
// 			typeof Component.type === 'function' &&
// 			Component.hasOwnProperty('props') &&
// 			Component.hasOwnProperty('__self')
// 		) {
// 			// console.log(typeof Component, Component);
// 			// Should be a Preact component already
// 			// return <Component {...defaultProps} />;
// 			return Component;
// 		}
// 	} else if (Component === 'Content') {
// 		// This is for being able to reference the content of the Notion page when defining layouts manually
// 		return Content;
// 	} else {
// 		// This should be a string not matching a component
// 		// If this was passed from an object definition, it should not survive
// 		return fromObjDef ? null : Component;
// 	}

// 	while (
// 		!(
// 			typeof CompRetrieved === 'function' ||
// 			CompRetrieved == null ||
// 			(typeof CompRetrieved === 'string' && !components[CompRetrieved])
// 		)
// 	) {
// 		CompRetrieved = retreiveComponent(CompRetrieved, components);
// 	}

// 	return CompRetrieved;
// };

// export const retreiveComponents = (components) => {
// 	const cleanCompList = {};

// 	for (let [key, Component] of Object.entries(components)) {
// 		if (Component == null) {
// 			// is undefined or null
// 			cleanCompList[key] = Component;
// 		} else if (Array.isArray(Component)) {
// 			// cleanCompList[key] = () => <>{Component.map((CompI) => retreiveComponent(CompI, defaultProps))}</>;
// 			cleanCompList[key] = retreiveComponent(Component, { ...components, ...cleanCompList });
// 		} else if (typeof Component === 'object') {
// 			if (Component.hasOwnProperty('component')) {
// 				// A component definition with passed props
// 				cleanCompList[key] = retreiveComponent(Component, { ...components, ...cleanCompList });
// 			} else {
// 				// this case is for nested components object. Ex: components = { Themes: { Light, Dark } }
// 				cleanCompList[key] = retreiveComponents(Component, { ...components, ...cleanCompList });
// 			}
// 		} else {
// 			cleanCompList[key] = retreiveComponent(Component, { ...components, ...cleanCompList });
// 		}
// 	}

// 	return cleanCompList;
// };

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
const L = ({
	children,
	components,
	poko,
	page,
	block,
	data,
	component,
	tag,
	Top: TopDef,
	Bottom: BottomDef,
	Middle: MiddleDef,
	Aside: AsideDef,
	Main: MainDef,
	...props
}) => {
	// A Layout component with props: data, Top, Bottom, Aside, Main
	// OR these might be named props
	// EX: { component: 'L', Data: ['level1Pages'], tag: 'Fragment', Top: ['InfoTop', 'Menu'], Bottom: ['Footer', 'ScriptsBottom'], Aside: null, Main: ['MyHeader', 'Children'] }
	// Then another component would be: {MyHeader: 'HeaderTitle'} so I can reassociate or nullify it as needed throughout the site

	// if (typeof component !== 'string') {
	// 	console.error(
	// 		`component prop of ${JSON.stringify(component)} on Layout component is not a string`
	// 	);
	// 	console.log({
	// 		// children,
	// 		// components,
	// 		// poko,
	// 		// page,
	// 		// block,
	// 		// data,
	// 		component,
	// 		tag,
	// 		Top: TopDef,
	// 		// Bottom: BottomDef,
	// 		// Middle: MiddleDef,
	// 		// Aside: AsideDef,
	// 		// Main: MainDef,
	// 		// ...props,
	// 	});
	// 	return null;
	// }

	// Gather props and computed props
	const pokoProps = { components, poko, page, block };
	const _allProps = { ...pokoProps, ...props };
	let computedDataProps = {};
	if (Array.isArray(data)) {
		for (const funcName of data) {
			computedDataProps[funcName] = computeDataFromHelper({ function: funcName, ..._allProps });
		}
	} else if (typeof data === 'string') {
		computedDataProps[data] = computeDataFromHelper({ function: data, ..._allProps });
	}
	const allProps = { ..._allProps, page: { ...page, ...computedDataProps } };

	const Tag = components[tag] || Fragment;

	// const allComponents = retreiveComponents({
	// 	...components,
	// 	Top: TopDef || undefined,
	// 	Bottom: BottomDef || undefined,
	// 	Middle: MiddleDef || undefined,
	// 	Aside: AsideDef || undefined,
	// 	Main: MainDef || undefined,
	// });
	// const { Top, Bottom, Middle = Fragment, Aside, Main = Fragment } =
	// 	addPropsOnComponents(allComponents, allProps);

	const {
		Top,
		Bottom,
		Middle = Fragment,
		Aside,
		Main = Fragment,
	} = addPropsOnComponents(
		{
			Top: TopDef || undefined,
			Bottom: BottomDef || undefined,
			Middle: MiddleDef || undefined,
			Aside: AsideDef || undefined,
			Main: MainDef || undefined,
		},
		allProps
	);

	return (
		<Tag {...{ tag, ...allProps }}>
			{Top && <Top {...allProps} />}
			<Middle {...allProps}>
				{Aside && <Aside {...allProps} />}
				{/* <Main {...allProps}>{children}</Main> */}
				{Main && <Main>{Content}</Main>}
			</Middle>
			{Bottom && <Bottom {...allProps} />}
		</Tag>
	);
};
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
	Content = children;
	// console.log({ children });

	// const Content = () => <>{children}</>;

	return <components.Layout {...allProps} />;
};

const LayoutDefault = ({ children, components, poko, page, block, ...props }) => {
	const pokoProps = { components, poko, page, block };
	const allProps = { ...pokoProps, ...props };

	return (
		<L
			{...{
				// tag: 'div',
				...allProps,
				// data: ['pagesLevel1'],
				Top: components.Top || components.Menu,
				Middle: components.Middle || components.Middle,
				Aside: components.Aside || components.Aside,
				Main: components.Main || [{ component: 'Header' }, { component: 'Content' }],
				Bottom: components.Bottom || components.Footer,
				// Top: { component: 'Element', tag: 'h2', children: 'Hey Menu', style: 'color: red;' },
				// Top: () => <components.h2 style="color: blue;">Hey from function</components.h2>,
				// Top: () => <LayoutMenu {...allProps} />,
				// Top: [
				// 	{ component: 'Element', tag: 'h2', children: 'Hey Menu', style: 'color: red;' },
				// 	['Test1', () => <components.h2 style="color: blue;">Hey from function</components.h2>],
				// ],
				// Middle: () => <components.main {...{ ...allProps, children }} />,
				// Aside: {
				// 	component: 'Element',
				// 	tag: 'aside',
				// 	// children: 'Hello aside',
				// 	children: [
				// 		{
				// 			component: 'Test',
				// 		},
				// 		{
				// 			component: 'Element',
				// 			tag: 'div',
				// 			class: 'content-wrapper',
				// 			children: 'Content',
				// 		},
				// 	],
				// },
				// Aside,
				// Main: [LayoutHeader(allProps), LayoutContent(allProps)],
				// Main: { component: 'Element', tag: 'div', class: 'main' },
				// Main: {
				// 	component: 'Element',
				// 	tag: 'div',
				// 	children: [
				// 		'Test',
				// 		page.title,
				// 		{ component: 'Element', tag: 'h2', children: 'Hey Menu', style: 'color: red;' },
				// 	],
				// },
				// Bottom: 'HeaderTest',
			}}
		/>
	);
};
const wrapperOld = ({ children, components, poko, page, block, ...props }) => {
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
	class: className,
	img: { class: classNameImg, ...img } = {},
	...props
}) => {
	const pokoProps = { components, poko, page, block };
	return (
		<E.div {...{ ...pokoProps, class: mergeClasses(['ImgLazyWrapper', className]) }}>
			<E.img
				{...{
					...pokoProps,
					src,
					alt,
					width,
					height,
					loading: 'lazy',
					...props,
					...img,
					class: mergeClasses([`ImgLazy`, classNameImg]),
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
const CollectionArticle = ({ components, poko, page, block, children, ...props }) => {
	return (
		<E.article
			{...{
				poko,
				page,
				block,
				['data-id']: poko.block.id,
				// class: "box shadowy",
				...props,
				class: `CollectionArticle ${props.class || ''}`,
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
			{...{ components, poko, page, block, class: 'CollectionArticleFeaturedImage', ...fi?.img }}
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
const CollectionArticleFooterProduct = ({ components, poko, page, block }) => {
	const pokoProps = { components, poko, page, block };
	const { title, description, jsonld, gallery, price, _definition } = block || {};
	const { canonicalUrl } = poko.block;
	const ld = jsonld || {};
	const featuredImage =
		block.featuredImage?.[0] || block.featuredImage || ld.image?.[0] || ld.image;
	const author = block.author || ld.author?.name;
	const datePublished = block.datePublished || ld.datePublished?.start;
	const ID = block.id || block.ID || block.sku || block.title || poko.block.id;
	const priceSymbol = _definition?.price?.number?.format === 'euro' ? '€' : '?';

	return (
		price && (
			<components.button
				{...pokoProps}
				style="z-index:0;/*--height-icon:1em;--width-icon:1em;*/"
				class="snipcart-add-item fs-h6"
				data-item-name={title}
				data-item-id={ID}
				data-item-price={price}
				data-item-description={description}
				data-item-image={featuredImage.url}
				data-item-url={canonicalUrl}
				data-item-has-taxes-included
			>
				{price}
				{priceSymbol}
			</components.button>
		)
	);
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
				<components.img {...{ components, poko, page, block, ...featuredImage.img }} />
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
	const { title, description, jsonld, gallery, price, _definition } = page || {};
	const { canonicalUrl } = poko.page;
	const ld = jsonld || {};
	const featuredImage = page.featuredImage?.[0] || page.featuredImage || ld.image?.[0] || ld.image;
	const author = page.author || ld.author?.name;
	const datePublished = page.datePublished || ld.datePublished?.start;
	const ID = page.id || page.ID || page.sku || page.title || poko.page.id;
	const priceSymbol = _definition?.price?.number?.format === 'euro' ? '€' : '?';

	return (
		title && (
			<div class="with-sidebar right" style="--width-sidebar: 25rem; --content-min: 40%;">
				<div class="stack">
					{featuredImage ? (
						<components.ImgLazy {...{ ...pokoProps, ...featuredImage.img }} />
					) : null}
					{gallery?.[0] && (
						<>
							<components.ul class="reset gallery grid" style="--width-column-min: 2rem;">
								{gallery.map(({ img }, i) => {
									return (
										<components.li>
											<components.a
												{...{
													...pokoProps,
													class: `gallery-item button`,
													id: `gallery-item-${i}`,
													['aria-label']: 'open image zoom',
													href: img.src, // Gets removed on DOMContentLoaded
													target: '_blank', // Gets removed on DOMContentLoaded
													// role: button best practices as per: https://www.w3.org/TR/2016/WD-wai-aria-practices-1.1-20160317/examples/button/button.html
													// onclick: `openModal(${i})`, // addEventListener on DOMContentLoaded
													// onkeydown: `openModal(${i})`, // addEventListener on DOMContentLoaded
													// tabindex: "0", // Gets added on DOMContentLoaded
													// role: "button" // Gets added on DOMContentLoaded
												}}
											>
												<components.ImgLazy
													{...{ ...pokoProps, ...img, id: `gallery-image-${i}` }}
												/>
											</components.a>
										</components.li>
									);
								})}
							</components.ul>
							<style>{`
							.gallery.grid > .gallery-item { background:none;border:none;padding:0; }
							.modal { block-size:100%;inline-size:100%;background:rgba(255,255,255,0.9);z-index:1;margin:0!important;overscroll-behavior:contain; }
							.modal-content, .modal-buttons { justify-content: center; }
							.modal-buttons > button { padding-inline: 1rem; }
						`}</style>
							<script
								async
								src="https://cdn.polyfill.io/v2/polyfill.min.js?features=Element.prototype.inert,Map,Set,Element.prototype.matches,Node.prototype.contains"
							></script>
							<script
								dangerouslySetInnerHTML={{
									__html: `
									// Keep after initialization
									let gallery = null;
									let allElems = null;
									let modalTemplate = null;
									let galleryMaxIndex = null;
									// nullify on close modal
									let initialBodyOverflow = null;
									let focusedElementBefore = null;
									let modal = null;
									let imageModal = null;
									let buttonClose = null;
									let buttonPrev = null;
									let buttonNext = null;

									modalTemplate = document.createElement('div');
									modalTemplate.setAttribute('class', 'modal cp- imposter fixed')
									modalTemplate.setAttribute('aria-label', 'image zoom')
									modalTemplate.setAttribute('aria-modal', 'true')
									modalTemplate.innerHTML = \`
										<div class="modal-content stack center intrinsic">
											<!-- Image goes here -->
											<div class="modal-buttons cluster">
												<button class="gallery-modal-button-prev">
													Précédent
												</button>
												<button class="gallery-modal-button-close" onclick="closeModal()">Fermer</button>
												<button class="gallery-modal-button-next">
													Suivant
												</button>
											</div>
										</div>
									\`

									const documentSetup = () => {
										gallery = document.querySelector('.gallery.grid');
										allElems = document.querySelectorAll('body > *:not([inert])');

										const imageLinks = gallery.querySelectorAll('a.gallery-item')
										for (const [i, imageLink] of imageLinks.entries()) {
											imageLink.removeAttribute('href');
											imageLink.removeAttribute('target');
											imageLink.setAttribute('tabindex', '0');
											imageLink.setAttribute('role', 'button');

											imageLink.addEventListener('click', () => openModal(i));
											imageLink.addEventListener('keydown', e => {
												if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
													openModal(i);
      												e.preventDefault();
												}
											})
										}
										galleryMaxIndex = imageLinks.length - 1
									}

									const openModal = (i) => {
										if (modal) closeModal()
										initialBodyOverflow = document.body.style.overflow;
										focusedElementBefore = document.activeElement;

										Array.prototype.forEach.call(allElems, elem => {
											elem.setAttribute('inert', 'inert')
										})

										modal = modalTemplate.cloneNode(true);
										// Buttons
										buttonClose = modal.querySelector('.gallery-modal-button-close');
										buttonPrev = modal.querySelector('.gallery-modal-button-prev');
										buttonNext = modal.querySelector('.gallery-modal-button-next');

										document.body.appendChild(modal);
										buttonClose.focus();

										modal.addEventListener('keydown', e => {
											if (e.keyCode === 27) { // Esc
												e.preventDefault();
												closeModal();
											}
										})
										
										document.body.style.overflow = "hidden";
										prependImageModal(i);
									}

									const prependImageModal = (i) => {
										const targetImage = gallery.querySelector('#gallery-image-' + i);
										if (!targetImage) {
											closeModal();
											return null
										};

										buttonPrev.setAttribute('onclick', 'prependImageModal(' + (i - 1) + ')');
										buttonNext.setAttribute('onclick', 'prependImageModal(' + (i + 1) + ')');
										if (i <= 0) {
											buttonPrev.setAttribute('disabled', 'disabled');
											buttonClose.focus();
										} else {
											buttonPrev.removeAttribute('disabled');
										}
										if (i >= galleryMaxIndex) {
											buttonNext.setAttribute('disabled', 'disabled');
											buttonClose.focus();
										} else {
											buttonNext.removeAttribute('disabled');
										}

										if (imageModal) {
											imageModal.remove();
											imageModal = null;
										}

										imageModal = targetImage.cloneNode(true);
										modal.querySelector('.modal-content').prepend(imageModal);
									}

									const closeModal = () => {
										document.body.style.overflow = initialBodyOverflow;

										Array.prototype.forEach.call(allElems, elem => {
											elem.removeAttribute('inert')
										})

										imageModal.remove()
										modal.remove()
										focusedElementBefore.focus();

										modal = null;
										imageModal = null;
										focusedElementBefore = null;
									}

									if (document.readyState === 'loading') {  // Loading hasn't finished yet
										document.addEventListener('DOMContentLoaded', documentSetup);
									} else {  // 'DOMContentLoaded' has already fired
										documentSetup();
									}
								`,
								}}
							></script>
						</>
					)}
				</div>
				<div>
					<components.header {...{ ...pokoProps, ...props }}>
						{title && <h1>{title}</h1>}
					</components.header>
					{price && (
						<div class="cluster">
							<p style="font-size: 1.17rem;">
								{price}
								{priceSymbol}
							</p>
							<components.button
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
							</components.button>
						</div>
					)}
				</div>
			</div>
		)
	);

	return (
		<components.header
			{...{ components, poko, page, block, class: 'stack', style: 'gap-stack: 1rem;' }}
		>
			{featuredImage ? (
				<components.img {...{ components, poko, page, block, ...featuredImage.img }} />
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

	const classMerged = mergeClasses([className, blockPropsFromPage.class]);

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

	const classMerged = mergeClasses([className, blockPropsFromPage.class]);

	return <Comp {...{ ...pokoProps, ...props, class: classMerged, children }} />;
};

// prettier-ignore
const elementsTags = ['div','a','blockquote','br','code','em','h1','h2','h3','h4','h5','h6','hr','img','li','ol','p','pre','strong','ul',
  // With remark-gfm (see guide) you can also use:
  'del','input','section','sup','table','tbody','td','th','thead','tr',
	// Other normal elements
  'main','footer','header','aside','article','nav','label','form', 'button']

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
	Fragment,
	L,
	E,
	...E,
	BlockToPage,
	Component,
	C: Component,
	Element,

	// --- SPECIAL COMPONENTS --- //
	wrapper,
	Layout: LayoutDefault,
	LayoutDefault,
	// Top: Null,
	// Middle: Null,
	// Aside: Null,
	// Main: Null,
	// Bottom: Null,
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
	PagesLevel1Data: () => null,
	List: ({ children, components, poko, page, block, tag, list, Item, ...props }) => {
		const Tag = components[tag] || components.ul;
		const ItemComp = components[Item] || components[children];
		return (
			<Tag {...{ ...pokoProps, class: mergeClasses(['List', props?.class]) }}>
				{Array.isArray(list) &&
					list.map(pageToLinkData).map((listItemData) => (
						<components.li {...{ class: 'Menu-right-item', ...pokoProps }}>
							<components.a
								{...{
									// href,
									class: 'Menu-right-a',
									// children: titleMenu || title || codeName,
									// ...pokoProps,
									...listItemData,
								}}
							/>
						</components.li>
					))}
			</Tag>
		);
	},
	ListItem: (listItemData) => null,
	PagesLevel1List: ({ children, components, poko, page, block, tag, ...props }) => {
		const pokoProps = { components, poko, page, block };
		const allProps = { ...pokoProps, ...props };
		const Tag = components[tag] || components.ul;

		// const topLevelPages = poko.pages.filter(
		// 	(p) => p.poko.page.status === 'published' && p.poko.page.parents?.length === 1
		// );

		return (
			<Tag {...{ ...allProps, class: mergeClasses([`PagesLevel1List`, props.class]) }}>
				{page.pagesLevel1 &&
					page.pagesLevel1.map(
						({
							page: { title, titleMenu },
							poko: {
								page: { href, codeName },
							},
						}) => (
							<components.li {...{ class: `Menu-list-item ${codeName}`, ...pokoProps }}>
								<components.a
									{...{
										href,
										class: `Menu-list-a ${codeName}`,
										children: titleMenu || title || codeName,
										...pokoProps,
									}}
								/>
							</components.li>
						)
					)}
			</Tag>
		);
	},
	MenuPagesLevel1: ({ children, components, poko, page, block, tag, ...props }) => {
		const pokoProps = { components, poko, page, block };
		const allProps = { ...pokoProps, ...props };
		const Tag = components[tag] || components.nav;

		return (
			<Tag {...{ ...allProps, class: mergeClasses(['Menu MenuPagesLevel1', props.class]) }}>
				<components.PagesLevel1List {...{ ...pokoProps, class: `List` }} />
			</Tag>
		);
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
		const pokoPropsCollection = { components, poko, page, block };
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

		// console.log(components.CollectionArticleFooter);

		return collectionItems.length ? (
			<components.CollectionWrapper {...{ ...pokoPropsCollection }}>
				{collectionItems.map(({ poko, page, block }) => {
					const pokoPropsItem = {
						components,
						poko: {
							page: pokoPropsCollection.poko.page,
							block: poko.page,
						},
						page: pokoPropsCollection.page,
						block: page,
					};

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
	// CollectionArticleFooterProduct,
	CollectionPageHeader: ({ components, poko, page, block, ...props }) => {
		const pokoProps = { components, poko, page, block };
		const allProps = { ...pokoProps, ...props };

		const ld = page.jsonld || {};
		const featuredImage = page.featuredImage || ld.image?.[0] || ld.image;
		const author = page.author || ld.author.name;
		const datePublished = page.datePublished || ld.datePublished?.start;

		return (
			<components.header {...{ ...allProps, class: 'stack', style: '--gap-stack: 1rem;' }}>
				{featuredImage ? <components.ImgLazy {...{ ...allProps, ...featuredImage.img }} /> : null}
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
		...props
	}) => {
		const pokoProps = { components, poko, page, block };
		const collectionIdNoHyphens = collectionId.replaceAll('-', '');
		const items = poko.pages.filter(({ poko, page, block }) => {
			const lastParent = poko.page.parents?.[poko.page.parents?.length - 1];
			return lastParent?.id?.replaceAll('-', '') === collectionIdNoHyphens;
		});
		// const scriptId = `searchbar-script-${collectionId}${id ? `-${id}` : ""}`;
		const styleId = `searchbar-style-${collectionId}${id ? `-${id}` : ''}`;
		const inputId = `searchbar-input-${collectionId}${id ? `-${id}` : ''}`;

		if (!items?.length) return null;

		const matchingItems = items?.map(({ poko, page, block }) => {
			// NOTE: we could add multiple matchable strings and join them here
			// const str = [poko.page.codeName].join(' ').toLowerCase();
			const str = [poko.page.codeName].join(' ');
			return {
				// href: item.poko.page.href,
				id: poko.page.id,
				str,
			};
		});
		// console.log(matchingItems);

		return (
			<>
				<style
					id={styleId}
					// dangerouslySetInnerHTML={{
					//   __html: stylesForChildren,
					// }}
				/>
				<components.div {...{ ...pokoProps, ...props, class: `SearchBar ${props.class || ''}` }}>
					{placeholder && (
						<components.label
							{...{
								...pokoProps,
								htmlFor: inputId,
								class: `SearchBarLabel`,
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
							...pokoProps,
							id: inputId,
							class: `SearchBarInput`,
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
  
                const val = this.value || '';
				const valRe = new RegExp(val, 'i');
                const matchingArray = JSON.parse(this.dataset.matchingArray);
                const doNotMatchSelector = matchingArray
                  .filter(({str}) => {
					console.log({ str, val, match: valRe.test(str) });
					return !valRe.test(str)})
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
	Test: () => {
		return <p>This is a test component</p>;
	},
	Test1: () => {
		return <p>This is another test component</p>;
	},
	Test2: ['Test', 'Test1'],
};

export default components;
