// import React from 'react'
import { h } from "preact";
import * as _jsx_runtime from 'preact/jsx-runtime'
// import { useMemo } from 'preact/hooks?module';
import { useMemo } from 'preact/hooks';
import { getMDXComponent } from "mdx-bundler/client/index.js";
// import { components as ReactComponents } from "@components/ReactComponents.jsx";
import pokoComponents, { addProps } from "@components/components.jsx";

export default function MDXBundler({ code, frontmatter, props: { components: exportedComponents, ...props } = {} }) {
  const components = addProps({
      ...pokoComponents,
      // ...ReactComponents,
      ...exportedComponents,
    }, props)
  // it's generally a good idea to memoize this function call to
  // avoid re-creating the component every render.
  
  const Component = useMemo(() => getMDXComponent(code, { _jsx_runtime, ...props }), [code]);
  // const Component = getMDXComponent(code, { _jsx_runtime, ...props });
  // console.log(Component)
  return (
    <Component {...{ components }} />
  );
}
