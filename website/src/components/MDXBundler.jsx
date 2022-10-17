// import React from 'react'
import { h } from "preact";
// import * as _jsx_runtime from 'preact/jsx-runtime'
import { useMemo } from 'preact/hooks?module';
// import { useMemo } from 'preact/hooks';
import { getMDXComponent } from "mdx-bundler/client/index.js";
import deepmerge from "deepmerge";
import { simpleDeepMerge } from '@utils'
// import { components as ReactComponents } from "@components/ReactComponents.jsx";
import pokoComponents, { addProps } from "@components/components.jsx";
import ComponentFromPage from "@components/ComponentFromPage.jsx"

export default function MDXBundler({
  code,
  frontmatter,
  componentsFromPages: _componentsFromPages,
  // props: propsUser = {},
  // dataForComponents
  selfProps
}) {
  // console.log(selfProps)
  const { components: componentsFromProps } = selfProps.page
  // const props = deepmerge(dataForComponents, propsUserRest)

  // ComponentsFromPages
  let componentsFromPages = {}
  _componentsFromPages.forEach(cfp => {
    // console.log(cfp.mdx.code)
    const key = cfp.codeName.replace(/^_/, '')
    // const Comp = useMemo(() => getMDXComponent(cfp.mdx?.code), [cfp.mdx?.code]);
    const Comp = () =>
      <ComponentFromPage {...{
        code: cfp.mdx?.code,
        frontmatter: undefined, 
        components: {...pokoComponents, ...componentsFromProps},
        props: selfProps,
      }} />

    if (key && Comp) {
      // componentsFromPages[key] = () => <Comp {...{ ...propsUserRest }} />
      componentsFromPages[key] = Comp
    }
  })

  const componentsFullMerged = {...pokoComponents, ...componentsFromPages, ...componentsFromProps}
  // console.log({propsUser, componentsFullMerged, dataForComponents})
  const propsDefaultForComponents = {
    ...selfProps,
    // ...propsUserRest,
    components: componentsFullMerged,
    // ...dataForComponents
    // metadata,
    // pathname,
    // Astro
  }
  
  let components = addProps(componentsFullMerged, propsDefaultForComponents)
  components = simpleDeepMerge(components, componentsFromPages)


  // it's generally a good idea to memoize this function call to
  // avoid re-creating the component every render.
  // const Component = useMemo(() => getMDXComponent(code, { _jsx_runtime, ...props }), [code]);
  const PageContent = useMemo(() => getMDXComponent(code), [code]);
  // const Component = getMDXComponent(code, { _jsx_runtime, ...props });
  // console.log({propsUserRest})
  return (
    <PageContent {...{ components, ...selfProps }} />
  );
}
