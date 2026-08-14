<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { createClient } from '@supabase/supabase-js';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

let totalSongs = $state(0);
let totalCategories = $state(0);



   onMount(async () => {
    const supabase = createClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    // Get total number of songs
    const {
        count: songsCount,
        error: songsError
    } = await supabase
        .from('songs')
        .select('id', { count: 'exact', head: true });

    if (songsError) {
        console.error('Error loading song count:', songsError);
    } else {
        totalSongs = songsCount ?? 0;
    }

        // Get total number of categories
        const {
            count: categoriesCount,
            error: categoriesError
        } = await supabase
            .from('categories')
            .select('id', { count: 'exact', head: true });

        if (categoriesError) {
            console.error(
                'Error loading category count:',
                categoriesError
            );
        } else {
            totalCategories = categoriesCount ?? 0;
        }

        console.log('Total Songs:', totalSongs);
        console.log('Total Categories:', totalCategories);
    });

    function goToAddSong() {
       goto('/admin/add-song');
    }

    function goToManageSongs() {
        goto('/admin/manage-songs');
    }

    function goToManageCategories() {
        goto('/admin/manage-categories');
    }
</script>

<svelte:head>
    <title>Admin Dashboard | Kannada Banger</title>
</svelte:head>


    <div class="admin-page">

    <header class="header">
        <div>
            <p class="eyebrow">KANNADA BANGER</p>

            <h1>Admin Dashboard</h1>

            <p class="subtitle">
                Manage your music collection and categories.
            </p>
        </div>
    </header>


    <main class="dashboard">

        <!-- STATS -->
        <section class="stats">

            <div class="stat-card">
                <span class="stat-icon">🎵</span>

                <div>
                    <p>Total Songs</p>
                    <h2>{totalSongs}</h2>
                </div>
            </div>


            <div class="stat-card">
                <span class="stat-icon">📂</span>

                <div>
                    <p>Total Categories</p>
                    <h2>{totalCategories}</h2>
                </div>
            </div>

        </section>


        <!-- ACTIONS -->
        <section class="actions">

            <!-- ADD SONG -->
            <button
                class="action-card"
                type="button"
                onclick={goToAddSong}
            >
                <span>＋</span>

                <div>
                    <h3>Add Song</h3>

                    <p>
                        Add a new song to your collection.
                    </p>
                </div>
            </button>


            <!-- MANAGE SONGS -->
            <button
                class="action-card"
                type="button"
                onclick={goToManageSongs}
            >
                <span>🎵</span>

                <div>
                    <h3>Manage Songs</h3>

                    <p>
                        View or delete existing songs.
                    </p>
                </div>
            </button>


            <!-- MANAGE CATEGORIES -->
            <button
                class="action-card"
                type="button"
                onclick={goToManageCategories}
            >
                <span>📁</span>

                <div>
                    <h3>Manage Categories</h3>

                    <p>
                        Add or manage music categories.
                    </p>
                </div>
            </button>

        </section>

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


    .admin-page {
        min-height: 100vh;
        padding: 50px;
        color: #2d241e;
    }


    .header {
        max-width: 1100px;
        margin: 0 auto 40px;
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


    .dashboard {
        max-width: 1100px;
        margin: 0 auto;
    }


    .stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
    }


    .stat-card {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 28px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 18px;
        box-shadow: 0 8px 25px rgba(80, 55, 35, 0.06);
    }


    .stat-icon {
        width: 55px;
        height: 55px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        background: #f1e6da;
        font-size: 24px;
        flex-shrink: 0;
    }


    .stat-card p {
        margin: 0 0 5px;
        color: #81746b;
        font-size: 14px;
    }


    .stat-card h2 {
        margin: 0;
        font-size: 30px;
    }


    .actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }


    .action-card {
        width: 100%;
        border: 1px solid #e5ddd4;
        background: white;
        border-radius: 18px;
        padding: 28px;
        text-align: left;
        cursor: pointer;
        transition: 0.2s ease;
        color: #2d241e;
        font-family: inherit;
    }


    .action-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(80, 55, 35, 0.1);
    }


    .action-card:active {
        transform: translateY(-1px);
    }


    .action-card > span {
        display: block;
        margin-bottom: 20px;
        font-size: 30px;
    }


    .action-card h3 {
        margin: 0 0 8px;
        font-size: 19px;
    }


    .action-card p {
        margin: 0;
        color: #81746b;
        font-size: 14px;
        line-height: 1.5;
    }

/* =========================================
   MOBILE RESPONSIVE - 480px
========================================= */

@media (max-width: 480px) {

    .admin-page {
        min-height: 100vh;
        padding: 30px 18px;
    }

    .header {
        margin-bottom: 28px;
    }

    .eyebrow {
        margin-bottom: 7px;
        font-size: 9px;
        letter-spacing: 3px;
    }

    h1 {
        font-size: 30px;
        line-height: 1.15;
    }

    .subtitle {
        margin-top: 8px;
        font-size: 13px;
        line-height: 1.5;
    }

    .dashboard {
        width: 100%;
    }

    /* =========================
       STATS
    ========================= */

    .stats {
        grid-template-columns: 1fr;
        gap: 14px;
        margin-bottom: 22px;
    }

    .stat-card {
        gap: 14px;
        padding: 20px;
        border-radius: 15px;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        font-size: 21px;
    }

    .stat-card p {
        margin-bottom: 4px;
        font-size: 12px;
    }

    .stat-card h2 {
        font-size: 26px;
    }

    /* =========================
       ACTIONS
    ========================= */

    .actions {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    .action-card {
        padding: 21px;
        border-radius: 15px;
    }

    .action-card > span {
        margin-bottom: 14px;
        font-size: 27px;
    }

    .action-card h3 {
        margin-bottom: 6px;
        font-size: 17px;
    }

    .action-card p {
        font-size: 12px;
        line-height: 1.5;
    }

}
/* =========================================
   TABLET RESPONSIVE - 768px
========================================= */

@media (max-width: 768px) {

    .admin-page {
        padding: 40px 30px;
    }

    .header {
        margin-bottom: 34px;
    }

    .eyebrow {
        margin-bottom: 8px;
        font-size: 10px;
        letter-spacing: 3.5px;
    }

    h1 {
        font-size: 38px;
        line-height: 1.15;
    }

    .subtitle {
        margin-top: 9px;
        font-size: 15px;
    }

    .dashboard {
        width: 100%;
    }

    /* STATS */

    .stats {
        gap: 16px;
        margin-bottom: 26px;
    }

    .stat-card {
        gap: 16px;
        padding: 24px;
        border-radius: 17px;
    }

    .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: 13px;
        font-size: 23px;
    }

    .stat-card p {
        font-size: 13px;
    }

    .stat-card h2 {
        font-size: 28px;
    }

    /* ACTIONS */

    .actions {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }

    .action-card {
        padding: 24px;
        border-radius: 17px;
    }

    .action-card > span {
        margin-bottom: 17px;
        font-size: 29px;
    }

    .action-card h3 {
        margin-bottom: 7px;
        font-size: 18px;
    }

    .action-card p {
        font-size: 13px;
        line-height: 1.5;
    }

}
</style>