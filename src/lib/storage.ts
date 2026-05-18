import { GeneratedArticle } from '@/types';

// Các hàm đổi tên và return Promise vì gọi API

export async function getGeneratedArticles(siteId?: string): Promise<GeneratedArticle[]> {
  if (typeof window === 'undefined') return [];
  try {
    const url = siteId ? `/api/articles?siteId=${siteId}` : '/api/articles';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch articles');
    const articles = await res.json();
    return articles;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveGeneratedArticle(article: GeneratedArticle): Promise<GeneratedArticle | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) throw new Error('Failed to save article');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function updateArticleInStorage(article: GeneratedArticle): Promise<GeneratedArticle | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`/api/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) throw new Error('Failed to update article');
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function deleteArticleFromStorage(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}
