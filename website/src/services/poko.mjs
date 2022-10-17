import remarkFrontmatter from "remark-frontmatter"; // YAML and such.
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
// import remarkUnwrapImages from "remark-unwrap-images";
import remarkGfm from "remark-gfm";
// import rehypeSlug from "rehype-slug";
import remarkBreaks from 'remark-breaks'

export const mdxConfigForExports = {
    mdxOptions(options, frontmatter) {
      options.jsxImportSource = 'preact'
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        // [
        //   remarkFrontmatter,
        //   {
        //     type: "yaml",
        //     fence: { open: "```yaml", close: "```" },
        //     // anywhere: true,
        //   },
        // ],
        // remarkMdxFrontmatter,
        // remarkUnwrapImages,
        remarkBreaks,
        remarkGfm,
      ];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        // rehypeSlug
      ];
      return options;
    },
    // esbuildOptions(options, frontmatter) {
    //   // options.minify = false;
    //   // options.target = ['es2020','chrome58','firefox57','safari11','edge16','node12']
    //   return options;
    // },
    //   files: {"./demo.tsx": `
    // import * as React from 'react'
    // function Demo() {return <div>Neat demo!</div>}
    // export default Demo`},
}

export const mdxConfigForPages = {
  mdxOptions(options, frontmatter) {
    options.jsxImportSource = 'preact'
    options.remarkPlugins = [
      ...(options.remarkPlugins ?? []),
      // [
      //   remarkFrontmatter,
      //   {
      //     type: "yaml",
      //     fence: { open: "```yaml", close: "```" },
      //     // anywhere: true,
      //   },
      // ],
      // remarkMdxFrontmatter,
      // remarkUnwrapImages,
      remarkBreaks,
      remarkGfm,
    ];
    options.rehypePlugins = [
      ...(options.rehypePlugins ?? []),
      // rehypeSlug
    ];
    return options;
  },
  // esbuildOptions(options, frontmatter) {
  //   // options.minify = false;
  //   // options.target = ['es2020','chrome58','firefox57','safari11','edge16','node12']
  //   return options;
  // },
  //   files: {"./demo.tsx": `
  // import * as React from 'react'
  // function Demo() {return <div>Neat demo!</div>}
  // export default Demo`},
}

export const presetsDico = {
    HeaderTitle: {
        components: {
            h1: "h2",
            h2: "h3",
            h3: "h4",
            h4: "h5",
            h5: "h6",
            header: "HeaderTitle"
        }
    },
    rows: {"test is ok": true }
}

export const getPresets = props => {
    let presets = []

    if (!Array.isArray(props.presets)) {
        // If it is an object, it is probably an object with only one key coming from a DB property
        if (typeof props.presets === 'object') {
            presets = [ props.presets ]
        } else {
            presets = []
        }
    } else presets = props.presets

    presets = presets.map(preset => {
        if (typeof preset === 'string') return presetsDico[preset] || undefined
        if (typeof preset === 'object' && !Array.isArray(preset)) {
            // If the values are booleans, we can treat the key as strings (useful for DB properties)
            return Object.entries(preset).map(([key, val]) => {
                if (typeof val === "boolean") return presetsDico[key] || undefined
                // TODO: How would this work...? Could we pass options into presets?
            })
        }
    }).flat().filter(z => typeof z !== 'undefined')
    
    return presets
}

