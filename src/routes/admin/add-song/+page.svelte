<script lang="ts">
    import { onMount } from 'svelte';
    import { createClient } from '@supabase/supabase-js';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

    let title = $state('');
    let artist = $state('');
    let youtubeId = $state('');
    let coverUrl = $state('');
    let selectedCategories = $state<string[]>([]);

    let categories = $state<string[]>([]);
    let loading = $state(false);
    let message = $state('');
    let errorMessage = $state('');

    onMount(async () => {
        const supabase = createClient(
            PUBLIC_SUPABASE_URL,
            PUBLIC_SUPABASE_PUBLISHABLE_KEY
        );

        const { data, error } = await supabase
            .from('categories')
            .select('name')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error loading categories:', error);
            errorMessage = 'Unable to load categories.';
            return;
        }

        categories =
            data
                ?.map((category) => category.name)
                .filter((name) => name && name !== 'All Songs') ?? [];
    });

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            selectedCategories = selectedCategories.filter(
                (item) => item !== category
            );
        } else {
            selectedCategories = [...selectedCategories, category];
        }
    };

    const addSong = async () => {
        message = '';
        errorMessage = '';

        if (!title.trim()) {
            errorMessage = 'Please enter the song title.';
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

        loading = true;

        const supabase = createClient(
            PUBLIC_SUPABASE_URL,
            PUBLIC_SUPABASE_PUBLISHABLE_KEY
        );

        const { data: song, error: songError } = await supabase
            .from('songs')
            .insert({
                title: title.trim(),
                artist: artist.trim(),
                youtube_id: youtubeId.trim(),
                cover_url: coverUrl.trim() || null,
                categories: selectedCategories
            })
            .select()
            .single();

        if (songError) {
            console.error('Error adding song:', songError);
            errorMessage = songError.message;
            loading = false;
            return;
        }

        console.log('Song added:', song);

        message = 'Song added successfully!';

        title = '';
        artist = '';
        youtubeId = '';
        coverUrl = '';
        selectedCategories = [];

        loading = false;
    };
</script>

<svelte:head>
    <title>Add Song | Kannada Banger Admin</title>
</svelte:head>

<div class="page">
    <div class="container">

        <a href="/admin" class="back">
            ← Back to Admin
        </a>

        <div class="header">
            <p class="eyebrow">KANNADA BANGER</p>
            <h1>Add Song</h1>
            <p>
                Add a new song to your music collection.
            </p>
        </div>

        <form onsubmit={(event) => {
            event.preventDefault();
            addSong();
        }}>

            <div class="field">
                <label for="title">Song Title</label>

                <input
                    id="title"
                    type="text"
                    bind:value={title}
                    placeholder="Enter song title"
                />
            </div>

            <div class="field">
                <label for="artist">Artist</label>

                <input
                    id="artist"
                    type="text"
                    bind:value={artist}
                    placeholder="Enter artist name"
                />
            </div>

            <div class="field">
                <label for="youtubeId">YouTube Video ID</label>

                <input
                    id="youtubeId"
                    type="text"
                    bind:value={youtubeId}
                    placeholder="Example: dQw4w9WgXcQ"
                />

                <small>
                    Use only the YouTube video ID, not the complete URL.
                </small>
            </div>

            <div class="field">
                <label for="coverUrl">Cover Image URL</label>

                <input
                    id="coverUrl"
                    type="text"
                    bind:value={coverUrl}
                    placeholder="https://..."
                />

                <small>
                    Optional. If left empty, the YouTube thumbnail will be used.
                </small>
            </div>

            <div class="field">
                <label>Categories</label>

                <div class="categories">
                    {#each categories as category}
                        <button
                            type="button"
                            class:selected={selectedCategories.includes(category)}
                            onclick={() => toggleCategory(category)}
                        >
                            {category}
                        </button>
                    {/each}
                </div>

                {#if categories.length === 0}
                    <small>
                        No categories available.
                    </small>
                {/if}
            </div>

            {#if errorMessage}
                <div class="error">
                    {errorMessage}
                </div>
            {/if}

            {#if message}
                <div class="success">
                    {message}
                </div>
            {/if}

            <button
                class="submit"
                type="submit"
                disabled={loading}
            >
                {loading ? 'Adding Song...' : 'Add Song'}
            </button>

        </form>

    </div>
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
        padding: 50px 20px;
        color: #2d241e;
    }

    .container {
        max-width: 700px;
        margin: 0 auto;
    }

    .back {
        display: inline-block;
        margin-bottom: 35px;
        color: #75685e;
        text-decoration: none;
        font-size: 14px;
    }

    .back:hover {
        color: #2d241e;
    }

    .header {
        margin-bottom: 35px;
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
    }

    .header p:last-child {
        margin-top: 10px;
        color: #75685e;
        font-size: 16px;
    }

    form {
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 8px 25px rgba(80, 55, 35, 0.06);
    }

    .field {
        margin-bottom: 24px;
    }

    label {
        display: block;
        margin-bottom: 9px;
        font-size: 14px;
        font-weight: 600;
    }

    input {
        width: 100%;
        padding: 13px 15px;
        border: 1px solid #ddd2c7;
        border-radius: 10px;
        background: #fff;
        font-size: 15px;
        color: #2d241e;
        outline: none;
    }

    input:focus {
        border-color: #8a684e;
    }

    small {
        display: block;
        margin-top: 7px;
        color: #81746b;
        font-size: 12px;
    }

    .categories {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .categories button {
        padding: 10px 16px;
        border: 1px solid #d8cbbf;
        border-radius: 20px;
        background: #fff;
        color: #5f5148;
        cursor: pointer;
        font-size: 14px;
    }

    .categories button.selected {
        background: #8a684e;
        color: white;
        border-color: #8a684e;
    }

    .error,
    .success {
        padding: 12px 15px;
        border-radius: 10px;
        margin-bottom: 18px;
        font-size: 14px;
    }

    .error {
        background: #fbe9e7;
        color: #a33a2b;
    }

    .success {
        background: #e8f4e8;
        color: #3c7040;
    }

    .submit {
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 10px;
        background: #2d241e;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
    }

    .submit:hover {
        background: #493a30;
    }

    .submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 600px) {
        .page {
            padding: 30px 16px;
        }

        h1 {
            font-size: 32px;
        }

        form {
            padding: 22px;
        }
    }
</style>