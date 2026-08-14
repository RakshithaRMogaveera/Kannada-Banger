<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { createClient } from '@supabase/supabase-js';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

    const supabase = createClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    let title = $state('');
    let artist = $state('');
    let youtubeId = $state('');
    let coverUrl = $state('');

    let categories = $state<any[]>([]);
    let selectedCategories = $state<string[]>([]);

    let loading = $state(true);
    let saving = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    let songId = $state('');

    onMount(async () => {
        songId = page.params.id ?? '';

        await loadSong();
        await loadCategories();
    });

    // =========================================================
    // LOAD SONG
    // =========================================================

    async function loadSong() {
        loading = true;
        errorMessage = '';

        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('id', songId)
            .single();

        if (error) {
            console.error('Error loading song:', error);
            errorMessage = 'Failed to load song.';
            loading = false;
            return;
        }

        console.log('Song loaded:', data);

        title = data.title ?? '';
        artist = data.artist ?? '';
        youtubeId = data.youtube_id ?? '';
        coverUrl = data.cover_url ?? '';

        /*
         * IMPORTANT:
         * We are now using the `categories` column.
         *
         * Example database value:
         * ["Kannada Banger", "Love", "Early 20s"]
         */

        if (Array.isArray(data.categories)) {
            selectedCategories = [...data.categories];
        } else {
            selectedCategories = [];
        }

        console.log('Existing categories:', selectedCategories);

        loading = false;
    }

    // =========================================================
    // LOAD AVAILABLE CATEGORIES
    // =========================================================

    async function loadCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading categories:', error);
            return;
        }

        categories = data ?? [];

        console.log('Available categories:', categories);
    }

    // =========================================================
    // TOGGLE CATEGORY
    // =========================================================

    function toggleCategory(categoryName: string) {
        if (selectedCategories.includes(categoryName)) {
            selectedCategories = selectedCategories.filter(
                (name) => name !== categoryName
            );
        } else {
            selectedCategories = [
                ...selectedCategories,
                categoryName
            ];
        }

        console.log('Selected categories:', selectedCategories);
    }

    // =========================================================
    // UPDATE SONG
    // =========================================================

    async function updateSong() {
        errorMessage = '';
        successMessage = '';

        // -----------------------------
        // Validation
        // -----------------------------

        if (!title.trim()) {
            errorMessage = 'Please enter a song title.';
            return;
        }

        if (!artist.trim()) {
            errorMessage = 'Please enter the artist name.';
            return;
        }

        if (!youtubeId.trim()) {
            errorMessage = 'Please enter the YouTube video ID.';
            return;
        }

        if (!songId) {
            errorMessage = 'Song ID is missing.';
            console.error('Song ID is missing');
            return;
        }

        saving = true;

        try {
            console.log('Updating song ID:', songId);

            /*
             * IMPORTANT:
             * We are updating the `categories` column.
             *
             * We are NOT using:
             * category
             * category_id
             */

            const updatedValues = {
                title: title.trim(),
                artist: artist.trim(),
                youtube_id: youtubeId.trim(),
                cover_url: coverUrl.trim() || null,
                categories: selectedCategories
            };

            console.log(
                'Values being sent to Supabase:',
                updatedValues
            );

            // -----------------------------
            // UPDATE SONG
            // -----------------------------

            const { error: updateError } = await supabase
                .from('songs')
                .update(updatedValues)
                .eq('id', songId);

            if (updateError) {
                console.error(
                    'Supabase update error:',
                    updateError
                );

                errorMessage =
                    `Failed to update song: ${updateError.message}`;

                saving = false;
                return;
            }

            console.log(
                'Update query completed successfully.'
            );

            // -----------------------------
            // VERIFY DATABASE
            // -----------------------------

            const {
                data: updatedSong,
                error: fetchError
            } = await supabase
                .from('songs')
                .select(
                    'id, title, artist, youtube_id, cover_url, categories'
                )
                .eq('id', songId)
                .single();

            if (fetchError) {
                console.error(
                    'Error checking updated song:',
                    fetchError
                );

                errorMessage =
                    `Update happened, but verification failed: ${fetchError.message}`;

                saving = false;
                return;
            }

            console.log(
                'Song after update:',
                updatedSong
            );

            // -----------------------------
            // VERIFY VALUES
            // -----------------------------

            const databaseCategories =
                Array.isArray(updatedSong.categories)
                    ? updatedSong.categories
                    : [];

            const categoriesMatch =
                JSON.stringify(databaseCategories) ===
                JSON.stringify(selectedCategories);

            const isUpdated =
                updatedSong.title === title.trim() &&
                updatedSong.artist === artist.trim() &&
                updatedSong.youtube_id === youtubeId.trim() &&
                (updatedSong.cover_url || null) ===
                    (coverUrl.trim() || null) &&
                categoriesMatch;

            if (!isUpdated) {
                console.error(
                    'Database values do not match:',
                    {
                        sent: updatedValues,
                        received: updatedSong
                    }
                );

                errorMessage =
                    'The changes were not saved correctly in the database.';

                saving = false;
                return;
            }

            // -----------------------------
            // SUCCESS
            // -----------------------------

            successMessage =
                'Song updated successfully!';

            console.log(
                'SUCCESS: Song updated in database.'
            );

            setTimeout(() => {
                goto('/admin/manage-songs');
            }, 1000);

        } catch (error) {
            console.error(
                'Unexpected error while updating song:',
                error
            );

            errorMessage =
                'Something went wrong while updating the song.';
        }

        saving = false;
    }
</script>


<svelte:head>
    <title>Edit Song | Kannada Banger</title>
</svelte:head>


<div class="page">

    <header class="header">

        <a
            href="/admin/manage-songs"
            class="back-link"
        >
            ← Back to Manage Songs
        </a>

        <p class="eyebrow">
            KANNADA BANGER
        </p>

        <h1>
            Edit Song
        </h1>

        <p class="subtitle">
            Update the details of your song.
        </p>

    </header>


    <main class="content">

        {#if loading}

            <div class="message">
                Loading song...
            </div>

        {:else}

            <form
                onsubmit={(event) => {
                    event.preventDefault();
                    updateSong();
                }}
            >

                <div class="form-card">

                    <!-- SONG TITLE -->

                    <div class="field">

                        <label for="title">
                            Song Title
                        </label>

                        <input
                            id="title"
                            type="text"
                            bind:value={title}
                            placeholder="Enter song title"
                        />

                    </div>


                    <!-- ARTIST -->

                    <div class="field">

                        <label for="artist">
                            Artist
                        </label>

                        <input
                            id="artist"
                            type="text"
                            bind:value={artist}
                            placeholder="Enter artist name"
                        />

                    </div>


                    <!-- YOUTUBE ID -->

                    <div class="field">

                        <label for="youtubeId">
                            YouTube Video ID
                        </label>

                        <input
                            id="youtubeId"
                            type="text"
                            bind:value={youtubeId}
                            placeholder="Example: rIPtyodvaJk"
                        />

                        <p class="hint">
                            Use only the YouTube video ID, not the complete URL.
                        </p>

                    </div>


                    <!-- COVER IMAGE -->

                    <div class="field">

                        <label for="coverUrl">
                            Cover Image URL
                        </label>

                        <input
                            id="coverUrl"
                            type="url"
                            bind:value={coverUrl}
                            placeholder="https://..."
                        />

                        <p class="hint">
                            Optional. If empty, the YouTube thumbnail will be used.
                        </p>

                    </div>


                    <!-- CATEGORIES -->

                    <div class="field">

                        <label>
                            Categories
                        </label>

                        <p class="category-hint">
                            Select one or more categories.
                            Click a selected category again to remove it.
                        </p>

                        <div class="categories">

                            {#each categories as category}

                                <button
                                    type="button"
                                    class:selected={selectedCategories.includes(category.name)}
                                    class="category-button"
                                    onclick={() =>
                                        toggleCategory(category.name)
                                    }
                                >
                                    {category.name}
                                </button>

                            {/each}

                        </div>


                        {#if selectedCategories.length > 0}

                            <p class="selected-text">
                                Selected:
                                {selectedCategories.join(', ')}
                            </p>

                        {:else}

                            <p class="selected-text">
                                No category selected.
                            </p>

                        {/if}

                    </div>


                    <!-- ERROR -->

                    {#if errorMessage}

                        <div class="error-message">
                            {errorMessage}
                        </div>

                    {/if}


                    <!-- SUCCESS -->

                    {#if successMessage}

                        <div class="success-message">
                            {successMessage}
                        </div>

                    {/if}


                    <!-- BUTTONS -->

                    <div class="buttons">

                        <button
                            type="button"
                            class="cancel-button"
                            onclick={() =>
                                goto('/admin/manage-songs')
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="save-button"
                            disabled={saving}
                        >
                            {saving
                                ? 'Saving...'
                                : 'Save Changes'}
                        </button>

                    </div>

                </div>

            </form>

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
        max-width: 820px;
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


    .form-card {
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 18px;
        padding: 34px;
        box-shadow: 0 8px 25px rgba(80, 55, 35, 0.06);
    }


    .field {
        margin-bottom: 26px;
    }


    label {
        display: block;
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: 700;
        color: #2d241e;
    }


    input {
        width: 100%;
        padding: 15px 16px;
        border: 1px solid #ddcfc2;
        border-radius: 11px;
        background: white;
        color: #2d241e;
        font-family: inherit;
        font-size: 15px;
        outline: none;
        transition: 0.2s ease;
    }


    input:focus {
        border-color: #8a684e;
        box-shadow:
            0 0 0 3px rgba(138, 104, 78, 0.08);
    }


    .hint {
        margin: 8px 0 0;
        color: #81746b;
        font-size: 12px;
    }


    .category-hint {
        margin: -2px 0 12px;
        color: #81746b;
        font-size: 12px;
    }


    .categories {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }


    .category-button {
        padding: 10px 16px;
        border: 1px solid #ddcdbd;
        border-radius: 22px;
        background: white;
        color: #76543d;
        font-family: inherit;
        font-size: 13px;
        cursor: pointer;
        transition: 0.2s ease;
    }


    .category-button:hover {
        background: #f5eee7;
    }


    .category-button.selected {
        background: #8a684e;
        border-color: #8a684e;
        color: white;
    }


    .selected-text {
        margin: 10px 0 0;
        color: #76543d;
        font-size: 12px;
    }


    .error-message {
        margin-bottom: 20px;
        padding: 14px 16px;
        background: #fde9e7;
        border-radius: 10px;
        color: #a33f35;
        font-size: 14px;
    }


    .success-message {
        margin-bottom: 20px;
        padding: 14px 16px;
        background: #e8f5e9;
        border-radius: 10px;
        color: #28753c;
        font-size: 14px;
    }


    .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
    }


    .cancel-button,
    .save-button {
        padding: 13px 22px;
        border-radius: 9px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }


    .cancel-button {
        border: 1px solid #d8c8ba;
        background: white;
        color: #5f4938;
    }


    .cancel-button:hover {
        background: #f8f3ee;
    }


    .save-button {
        border: 1px solid #2d241e;
        background: #2d241e;
        color: white;
    }


    .save-button:hover:not(:disabled) {
        background: #44352b;
    }


    .save-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }


    .message {
        padding: 50px 30px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 18px;
        text-align: center;
        color: #81746b;
    }


    @media (max-width: 700px) {

        .page {
            padding: 30px 18px 50px;
        }


        h1 {
            font-size: 32px;
        }


        .form-card {
            padding: 24px 20px;
        }


        .buttons {
            flex-direction: column-reverse;
        }


        .cancel-button,
        .save-button {
            width: 100%;
        }

    }

</style>