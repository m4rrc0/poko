// import React from 'react'
import { h } from 'preact';
// import * as _jsx_runtime from 'preact/jsx-runtime'
import { useMemo } from 'preact/hooks?module';
// import { useMemo } from 'preact/hooks';
import { getMDXComponent } from 'mdx-bundler/client/index.js';
import deepmerge from 'deepmerge';
// import { simpleDeepMerge } from '@utils'
// import { components as ReactComponents } from "@components/ReactComponents.jsx";
import pokoComponents, {
	retreiveComponents,
	addPropsOnComponents,
} from '@components/components.jsx';
import ComponentFromPage from '@components/ComponentFromPage.jsx';

export default function MDXBundler({
	code,
	frontmatter,
	componentsFromPages: _componentsFromPages,
	// props: propsUser = {},
	// dataForComponents
	selfProps,
}) {
	// console.log(selfProps)
	const { components: componentsFromProps } = selfProps.page;
	// const props = deepmerge(dataForComponents, propsUserRest)
	// const pokoComponentsWithProps = addPropsOnComponents(pokoComponents, {
	// 	...selfProps,
	// 	components: { ...pokoComponents },
	// });

	// ComponentsFromPages
	let componentsFromPages = {};
	_componentsFromPages.forEach((cfp) => {
		// console.log(cfp.mdx.code)
		const key = cfp.codeName.replace(/^_/, '');
		// const Comp = useMemo(() => getMDXComponent(cfp.mdx?.code), [cfp.mdx?.code]);
		const Comp = (props) => (
			<ComponentFromPage
				{...{
					code: cfp.mdx?.code,
					frontmatter: undefined,
					components: { ...pokoComponents, ...componentsFromProps },
					...selfProps,
					...props,
				}}
			/>
		);

		if (key && Comp) {
			// componentsFromPages[key] = () => <Comp {...{ ...propsUserRest }} />
			componentsFromPages[key] = Comp;
		}
	});

	// console.log({ componentsFromPages });

	// const componentsFromPagesWithProps = addPropsOnComponents(componentsFromPages, {
	// 	...selfProps,
	// 	components: { ...pokoComponentsWithProps, ...componentsFromPages },
	// });

	// const componentsFromPropsWithProps = addPropsOnComponents(componentsFromProps, {
	// 	...selfProps,
	// 	components: {
	// 		...pokoComponentsWithProps,
	// 		...componentsFromPagesWithProps,
	// 		...componentsFromProps,
	// 	},
	// });

	// console.log({
	// 	...pokoComponents,
	// 	...componentsFromPages,
	// 	...componentsFromProps,
	// });

	const componentsFullMerged = {
		...pokoComponents,
		...componentsFromPages,
		...componentsFromProps,
	};

	// console.log(componentsFullMerged);

	// console.log({propsUser, componentsFullMerged, dataForComponents})
	// const propsDefaultForComponents = {
	// 	...selfProps,
	// 	// ...propsUserRest,
	// 	components: componentsFullMerged,
	// 	// ...dataForComponents
	// 	// metadata,
	// 	// pathname,
	// 	// Astro
	// };

	// const componentsWithProps = addPropsOnComponents(componentsFullMerged, propsDefaultForComponents);
	// const components = deepmerge(componentsWithProps, componentsFromPages);
	// const components = { ...componentsWithProps, ...componentsFromPages };

	const components = addPropsOnComponents(componentsFullMerged, {
		...selfProps,
		components: componentsFullMerged,
	});

	// TODO: components are not populated with all components defined in props???
	// console.log(components);

	// it's generally a good idea to memoize this function call to
	// avoid re-creating the component every render.
	// const Component = useMemo(() => getMDXComponent(code, { _jsx_runtime, ...props }), [code]);
	const Wrapper = useMemo(() => getMDXComponent(code), [code]);
	// const Component = getMDXComponent(code, { _jsx_runtime, ...props });
	// console.log({propsUserRest})
	return <Wrapper {...{ ...selfProps, components }} />;
}
