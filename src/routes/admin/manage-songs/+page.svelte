<script lang="ts">
    import { onMount } from 'svelte';
    import { createClient } from '@supabase/supabase-js';
    import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
    import { goto } from '$app/navigation';

    const supabase = createClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    let songs = $state<any[]>([]);
    let categories = $state<any[]>([]);

    let loading = $state(true);
    let deletingId = $state<number | string | null>(null);
    let searchQuery = $state('');

    /*
     * Get categories directly from the `categories` column.
     *
     * Your database stores categories like:
     * ["Kannada Banger", "Love", "Early 20s"]
     *
     * We keep this as an array so one song can belong
     * to multiple categories while still remaining ONE row
     * in the songs table.
     */
    function getCategories(song: any): string[] {
        if (!song?.categories) {
            return [];
        }

        if (Array.isArray(song.categories)) {
            return song.categories.filter(
                (category: any) =>
                    typeof category === 'string' && category.trim() !== ''
            );
        }

        /*
         * Safety handling in case Supabase returns the value
         * as a JSON string.
         */
        if (typeof song.categories === 'string') {
            try {
                const parsed = JSON.parse(song.categories);

                if (Array.isArray(parsed)) {
                    return parsed.filter(
                        (category: any) =>
                            typeof category === 'string' &&
                            category.trim() !== ''
                    );
                }
            } catch {
                /*
                 * If it is just a normal string, show it as
                 * one category.
                 */
                if (song.categories.trim() !== '') {
                    return [song.categories.trim()];
                }
            }
        }

        return [];
    }

    /*
     * Search songs by:
     * - Song title
     * - Artist
     * - Any category
     */
    let filteredSongs = $derived(
        songs.filter((song) => {
            const query = searchQuery.trim().toLowerCase();

            if (!query) {
                return true;
            }

            const title = song.title?.toLowerCase() || '';
            const artist = song.artist?.toLowerCase() || '';

            const categoryNames = getCategories(song)
                .join(' ')
                .toLowerCase();

            return (
                title.includes(query) ||
                artist.includes(query) ||
                categoryNames.includes(query)
            );
        })
    );

    /*
     * Load all songs and categories.
     */
    async function loadSongs() {
        loading = true;

        /*
         * Load songs.
         *
         * IMPORTANT:
         * We select * so the `categories` column is included.
         */
        const { data: songsData, error: songsError } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });

        if (songsError) {
            console.error('Error loading songs:', songsError);
            songs = [];
        } else {
            songs = songsData ?? [];

            console.log('Songs loaded:', songs);

            /*
             * Check the categories coming from the database.
             */
            console.log(
                'Categories stored in songs:',
                songs.map((song) => ({
                    id: song.id,
                    title: song.title,
                    categories: song.categories
                }))
            );
        }

        /*
         * Load categories table.
         *
         * This is kept because the admin section may still
         * need the category list elsewhere.
         */
        const {
            data: categoriesData,
            error: categoriesError
        } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (categoriesError) {
            console.error('Error loading categories:', categoriesError);
            categories = [];
        } else {
            categories = categoriesData ?? [];

            console.log('Categories loaded:', categories);
        }

        loading = false;

        console.log('Loading finished:', loading);
    }

    /*
     * Delete a song.
     */
    async function deleteSong(song: any) {
        const confirmed = confirm(
            `Are you sure you want to delete "${song.title}"?`
        );

        if (!confirmed) {
            return;
        }

        deletingId = song.id;

        const { data, error } = await supabase
            .from('songs')
            .delete()
            .eq('id', song.id)
            .select();

        if (error) {
            console.error('Error deleting song:', error);
            alert('Failed to delete song.');
        } else if (!data || data.length === 0) {
            console.error(
                'Song was not deleted. Check RLS policies.'
            );

            alert('Song was not deleted from the database.');
        } else {
            /*
             * Remove the deleted song immediately from the UI.
             */
            songs = songs.filter(
                (item) => item.id !== song.id
            );

            console.log(
                'Song deleted successfully:',
                data
            );
        }

        deletingId = null;
    }

    /*
     * Load data when page opens.
     */
    onMount(async () => {
        await loadSongs();
    });
</script>

<svelte:head>
    <title>Manage Songs | Kannada Banger</title>
</svelte:head>

<div class="page">

    <header class="header">

        <a href="/admin" class="back-link">
            ← Back to Admin
        </a>

        <p class="eyebrow">
            KANNADA BANGER
        </p>

        <h1>
            Manage Songs
        </h1>

        <p class="subtitle">
            View and manage your music collection.
        </p>

    </header>

    <main class="content">

        {#if loading}

            <div class="loading">
                Loading songs...
            </div>

        {:else if songs.length === 0}

            <div class="empty">

                <div class="empty-icon">
                    🎵
                </div>

                <h2>
                    No songs found
                </h2>

                <p>
                    Add your first song from the admin dashboard.
                </p>

                <a
                    href="/admin/add-song"
                    class="add-button"
                >
                    Add Song
                </a>

            </div>

        {:else}

            <div class="top-bar">

                <div class="songs-heading">

                    <h2>
                        All Songs
                    </h2>

                    <p>
                        {#if searchQuery.trim()}

                            Showing
                            {filteredSongs.length}
                            of
                            {songs.length}
                            songs

                        {:else}

                            {songs.length}
                            songs in your collection

                        {/if}
                    </p>

                </div>

                <div class="top-actions">

                    <div class="search-box">

                        <span class="search-icon">
                            ⌕
                        </span>

                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Search songs..."
                            aria-label="Search songs"
                        />

                        {#if searchQuery}

                            <button
                                type="button"
                                class="clear-search"
                                onclick={() => (searchQuery = '')}
                                aria-label="Clear search"
                            >
                                ×
                            </button>

                        {/if}

                    </div>

                    <a
                        href="/admin/add-song"
                        class="add-button"
                    >
                        ＋ Add Song
                    </a>

                </div>

            </div>

            <div class="songs-list">

                {#if filteredSongs.length === 0}

                    <div class="no-results">

                        <div class="no-results-icon">
                            ⌕
                        </div>

                        <h3>
                            No songs found
                        </h3>

                        <p>
                            No songs match "{searchQuery}".
                        </p>

                        <button
                            type="button"
                            onclick={() => (searchQuery = '')}
                        >
                            Clear Search
                        </button>

                    </div>

                {:else}

                    {#each filteredSongs as song}

                        <div class="song-card">

                            <div class="song-image">

                                <img
                                    src={
                                        song.cover_url ||
                                        `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
                                    }
                                    alt={song.title}
                                />

                            </div>

                            <div class="song-info">

                                <h3>
                                    {song.title}
                                </h3>

                                <p class="artist">
                                    {song.artist || 'Unknown Artist'}
                                </p>

                                <div class="categories">

                                    {#if getCategories(song).length > 0}

                                        {#each getCategories(song) as category}

                                            <span class="category">
                                                {category}
                                            </span>

                                        {/each}

                                    {:else}

                                        <span class="no-category">
                                            No category
                                        </span>

                                    {/if}

                                </div>

                            </div>

                            <div class="song-actions">

                                <button
                                    class="edit-button"
                                    type="button"
                                    onclick={() =>
                                        goto(`/admin/edit-song/${song.id}`)
                                    }
                                >
                                    Edit
                                </button>

                                <button
                                    class="delete-button"
                                    type="button"
                                    onclick={() => deleteSong(song)}
                                    disabled={deletingId === song.id}
                                >
                                    {deletingId === song.id
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>

                            </div>

                        </div>

                    {/each}

                {/if}

            </div>

        {/if}

    </main>

</div>



<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        background: #f5f1eb;
        font-family: Arial, sans-serif;
    }

    :global(*) {
        box-sizing: border-box;
    }

    .page {
        min-height: 100vh;
        padding: 45px 50px 70px;
        color: #2d241e;
    }

    .header,
    .content {
        max-width: 1100px;
        margin: 0 auto;
    }

    .header {
        margin-bottom: 35px;
    }

    .back-link {
        display: inline-block;
        margin-bottom: 30px;
        color: #76543d;
        text-decoration: none;
        font-size: 13px;
    }

    .back-link:hover {
        text-decoration: underline;
    }

    .eyebrow {
        margin: 0 0 8px;
        font-size: 11px;
        letter-spacing: 4px;
        color: #8a684e;
        font-weight: 700;
    }

    h1 {
        margin: 0;
        font-size: 42px;
        font-weight: 700;
    }

    .subtitle {
        margin: 10px 0 0;
        color: #75685e;
        font-size: 16px;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .top-bar h2 {
        margin: 0 0 5px;
        font-size: 22px;
    }

    .top-bar p {
        margin: 0;
        color: #81746b;
        font-size: 14px;
    }

    .add-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 11px 18px;
        background: #2d241e;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
    }

    .add-button:hover {
        background: #44352b;
    }

    .songs-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .song-card {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 16px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 15px;
        box-shadow: 0 6px 20px rgba(80, 55, 35, 0.05);
    }

    .song-image {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        overflow: hidden;
        border-radius: 10px;
        background: #f1e6da;
    }

    .song-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .song-info {
        flex: 1;
        min-width: 0;
    }

    .song-info h3 {
        margin: 0 0 5px;
        font-size: 17px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .artist {
        margin: 0 0 10px;
        color: #81746b;
        font-size: 14px;
    }

    .categories {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .category {
        padding: 5px 9px;
        border: 1px solid #ddcdbd;
        border-radius: 20px;
        color: #76543d;
        font-size: 11px;
    }

    .no-category {
        color: #a0948b;
        font-size: 12px;
    }

    .song-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .song-actions button {
        padding: 9px 14px;
        border-radius: 7px;
        font-size: 13px;
        cursor: pointer;
        font-weight: 600;
    }

    .edit-button {
        border: 1px solid #d8c8ba;
        background: white;
        color: #5f4938;
    }

    .edit-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .delete-button {
        border: 1px solid #d8bdb5;
        background: white;
        color: #9b493d;
    }

    .delete-button:hover:not(:disabled) {
        background: #fff3f1;
    }

    .delete-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .loading,
    .empty {
        padding: 60px 30px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 18px;
        text-align: center;
    }

    .empty-icon {
        font-size: 40px;
        margin-bottom: 12px;
    }

    .empty h2 {
        margin: 0 0 8px;
        font-size: 22px;
    }

    .empty p {
        margin: 0 0 22px;
        color: #81746b;
        font-size: 14px;
    }
.songs-heading {
    min-width: 0;
}

.top-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-box {
    position: relative;
    width: 260px;
    height: 42px;
}

.search-box input {
    width: 100%;
    height: 100%;
    padding: 0 38px 0 40px;
    border: 1px solid #ddcdbd;
    border-radius: 9px;
    background: white;
    color: #2d241e;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box input::placeholder {
    color: #a0948b;
}

.search-box input:focus {
    border-color: #8a684e;
    box-shadow: 0 0 0 3px rgba(138, 104, 78, 0.08);
}

.search-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #76543d;
    font-size: 22px;
    line-height: 1;
    pointer-events: none;
}

.clear-search {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #f1e6da;
    color: #76543d;
    font-size: 18px;
    line-height: 24px;
    cursor: pointer;
}

.clear-search:hover {
    background: #e5d6c7;
}

.no-results {
    padding: 55px 25px;
    background: white;
    border: 1px solid #e5ddd4;
    border-radius: 18px;
    text-align: center;
}

.no-results-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f1e6da;
    color: #76543d;
    font-size: 27px;
}

.no-results h3 {
    margin: 0 0 7px;
    font-size: 20px;
}

.no-results p {
    margin: 0 0 20px;
    color: #81746b;
    font-size: 14px;
}

.no-results button {
    padding: 10px 18px;
    border: 1px solid #d8c8ba;
    border-radius: 8px;
    background: white;
    color: #5f4938;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.no-results button:hover {
    background: #f8f3ee;
}

@media (max-width: 700px) {

    .page {
        padding: 30px 18px 50px;
    }

    h1 {
        font-size: 32px;
    }

    .top-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    .songs-heading {
        width: 100%;
    }

    .top-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .search-box {
        width: 100%;
        height: 44px;
    }

    .add-button {
        width: 100%;
    }

    .song-card {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .song-info {
        width: calc(100% - 100px);
    }

    .song-actions {
        width: 100%;
        margin-top: 5px;
    }

    .song-actions button {
        flex: 1;
    }

    .no-results {
        padding: 45px 20px;
    }
}
</style>