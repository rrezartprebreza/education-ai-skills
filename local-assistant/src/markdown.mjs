import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const processor = unified().use(remarkParse).use(remarkGfm).use(() => tree => {
  function walk(node) {
    if (node.children) {
      node.children = node.children.filter(child => child.type !== 'image' && child.type !== 'imageReference');
      node.children.forEach(walk);
    }
    if (node.type === 'link') {
      if (!/^https?:\/\//i.test(node.url)) node.url = '#';
      node.data = { hProperties: { target: '_blank', rel: 'noreferrer noopener' } };
    }
  }
  walk(tree);
}).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify);

export const markdown = text => String(processor.processSync(text));
