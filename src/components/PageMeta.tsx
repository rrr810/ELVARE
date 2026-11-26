import { useEffect } from 'react';

export function PageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | ÉLVARÉ`;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionTag) descriptionTag.content = description;
  }, [title, description]);

  return null;
}

export function formatKsh(amount: number) {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}
