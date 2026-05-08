export const useNovedades = () => {
    const client = useSupabaseClient()

    const getNews = async (categoryId = null) => {
        let query = client
            .from('news')
            .select('id, title, content, image_url, publication_date, brand:brand_id(id, name, image_url), category:category_id(id, name)')
            .eq('status', 'approved')
            .order('publication_date', { ascending: false })

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error cargando novedades:', error)
            return []
        }

        return data || []
    }

    const getCategories = async () => {
        const { data, error } = await client
            .from('news_categories')
            .select('id, name')
            .order('id')

        if (error) {
            console.error('Error cargando categorías:', error)
            return []
        }

        return data || []
    }

    return { getNews, getCategories }
}
