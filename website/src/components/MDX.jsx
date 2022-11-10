import { h } from 'preact';
import { MDXRemote } from 'next-mdx-remote';
import { components as ReactComponents } from '@components/ReactComponents.jsx';
import pokoComponents, { addPropsOnComponents } from '@components/components.jsx';

export default function MDX({
	mdxSource,
	scope,
	props: { components: exportedComponents, ...props } = {},
}) {
	const components = addPropsOnComponents(
		{
			// ...pokoComponents,
			// ...ReactComponents,
			// ...exportedComponents,
		},
		props
	);
	return <MDXRemote {...mdxSource} scope={scope} components={components} />;
}
