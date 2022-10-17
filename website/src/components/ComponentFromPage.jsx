import { h } from "preact";
import { useMemo } from 'preact/hooks?module';
import { getMDXComponent } from "mdx-bundler/client/index.js";

const ComponentFromPage = ({
  code,
  components: { wrapper, ...components },
  props
}) => {  
  const Comp = useMemo(() => getMDXComponent(code), [code]);

  return <Comp {...{ components, ...props }} />
};

export default ComponentFromPage;
