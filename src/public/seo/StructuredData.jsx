import { useEffect } from 'react';

export default function StructuredData({ id = 'public-ld-json', data }) {
  useEffect(() => {
    if (!data) return;

    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);

    return () => {
      const node = document.getElementById(id);
      if (node) {
        node.remove();
      }
    };
  }, [id, data]);

  return null;
}
