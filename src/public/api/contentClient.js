import { getPublicSupabaseClient } from '@/public/api/publicSupabaseClient';

const postSelect = `
  id,
  slug,
  status,
  title_it,
  title_en,
  title_de,
  excerpt_it,
  excerpt_en,
  excerpt_de,
  content_markdown_it,
  content_markdown_en,
  content_markdown_de,
  cover_image_url,
  cover_alt_it,
  cover_alt_en,
  cover_alt_de,
  seo_title_it,
  seo_title_en,
  seo_title_de,
  seo_description_it,
  seo_description_en,
  seo_description_de,
  featured,
  published_at,
  reading_time_minutes,
  tags,
  created_date,
  updated_date,
  category:blog_categories(id,slug,name_it,name_en,name_de),
  author:blog_authors(id,slug,full_name,role_title_it,role_title_en,role_title_de)
`;

export const contentClient = {
  async listPublishedPosts() {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(postSelect)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPublishedPostBySlug(slug) {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(postSelect)
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async listCategories() {
    const supabase = getPublicSupabaseClient();
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .order('name_it', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
