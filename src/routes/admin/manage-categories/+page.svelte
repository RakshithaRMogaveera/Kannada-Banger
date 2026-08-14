<script lang="ts">
    import { onMount } from 'svelte';
    import { createClient } from '@supabase/supabase-js';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

    const supabase = createClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    let categories = $state<any[]>([]);
    let loading = $state(true);
    let newCategory = $state('');
    let adding = $state(false);
    let deletingId = $state<string | null>(null);

    async function loadCategories() {
        loading = true;

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading categories:', error);
            categories = [];
        } else {
            categories = data ?? [];
            console.log('Categories loaded:', categories);
        }

        loading = false;
    }

    async function addCategory() {
        const name = newCategory.trim();

        if (!name) {
            alert('Please enter a category name.');
            return;
        }

        adding = true;

        const { data, error } = await supabase
            .from('categories')
            .insert({ name })
            .select()
            .single();

        if (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category.');
        } else {
            categories = [...categories, data].sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            newCategory = '';
        }

        adding = false;
    }
async function deleteCategory(category: any) {
    const confirmed = confirm(
        `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    deletingId = category.id;

    const { data, error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .select();

    if (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category.');
    } else if (!data || data.length === 0) {
        console.error(
            'Category was not deleted. Check RLS policies.'
        );
        alert('Category was not deleted from the database.');
    } else {
        categories = categories.filter(
            (item) => item.id !== category.id
        );

        console.log(
            'Category deleted successfully:',
            data
        );
    }

    deletingId = null;
}

    onMount(async () => {
        await loadCategories();
    });
</script>

<svelte:head>
    <title>Manage Categories | Kannada Banger</title>
</svelte:head>

<div class="page">

    <header class="header">

        <a href="/admin" class="back-link">
            ← Back to Admin
        </a>

        <p class="eyebrow">KANNADA BANGER</p>

        <h1>Manage Categories</h1>

        <p class="subtitle">
            Add and manage your music categories.
        </p>

    </header>

    <main class="content">

        <section class="add-section">

            <div>
                <h2>Add Category</h2>
                <p>Create a new category for your songs.</p>
            </div>

            <div class="add-form">

                <input
                    type="text"
                    placeholder="Enter category name"
                    bind:value={newCategory}
                    onkeydown={(event) => {
                        if (event.key === 'Enter') {
                            addCategory();
                        }
                    }}
                />

                <button
                    type="button"
                    onclick={addCategory}
                    disabled={adding}
                >
                    {adding ? 'Adding...' : 'Add Category'}
                </button>

            </div>

        </section>


        {#if loading}

            <div class="loading">
                Loading categories...
            </div>

        {:else if categories.length === 0}

            <div class="empty">

                <div class="empty-icon">📂</div>

                <h2>No categories found</h2>

                <p>
                    Add your first category above.
                </p>

            </div>

        {:else}

            <div class="categories-header">

                <div>
                    <h2>All Categories</h2>
                    <p>
                        {categories.length} categories in your collection
                    </p>
                </div>

            </div>

            <div class="categories-list">

                {#each categories as category}

                    <div class="category-card">

                        <div class="category-icon">
                            📁
                        </div>

                        <div class="category-info">

                            <h3>{category.name}</h3>

                            <p>
                                Music category
                            </p>

                        </div>

                        <button
                            class="delete-button"
                            type="button"
                            onclick={() => deleteCategory(category)}
                            disabled={deletingId === category.id}
                        >
                            {deletingId === category.id
                                ? 'Deleting...'
                                : 'Delete'}
                        </button>

                    </div>

                {/each}

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

    .add-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 30px;
        padding: 25px;
        margin-bottom: 25px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 18px;
        box-shadow: 0 6px 20px rgba(80, 55, 35, 0.05);
    }

    .add-section h2 {
        margin: 0 0 5px;
        font-size: 21px;
    }

    .add-section p {
        margin: 0;
        color: #81746b;
        font-size: 14px;
    }

    .add-form {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }

    .add-form input {
        width: 230px;
        padding: 11px 13px;
        border: 1px solid #d8c8ba;
        border-radius: 8px;
        outline: none;
        font-size: 14px;
        color: #2d241e;
        background: white;
    }

    .add-form input:focus {
        border-color: #8a684e;
    }

    .add-form button {
        padding: 11px 18px;
        border: none;
        border-radius: 8px;
        background: #2d241e;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }

    .add-form button:hover:not(:disabled) {
        background: #44352b;
    }

    .add-form button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .categories-header {
        margin-bottom: 15px;
    }

    .categories-header h2 {
        margin: 0 0 5px;
        font-size: 22px;
    }

    .categories-header p {
        margin: 0;
        color: #81746b;
        font-size: 14px;
    }

    .categories-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
    }

    .category-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 18px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 15px;
        box-shadow: 0 6px 20px rgba(80, 55, 35, 0.05);
    }

    .category-icon {
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #f1e6da;
        font-size: 22px;
    }

    .category-info {
        flex: 1;
        min-width: 0;
    }

    .category-info h3 {
        margin: 0 0 5px;
        font-size: 17px;
    }

    .category-info p {
        margin: 0;
        color: #81746b;
        font-size: 13px;
    }

    .delete-button {
        padding: 9px 14px;
        border: 1px solid #d8bdb5;
        border-radius: 7px;
        background: white;
        color: #9b493d;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
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
        margin: 0;
        color: #81746b;
        font-size: 14px;
    }

    @media (max-width: 700px) {

        .page {
            padding: 30px 18px 50px;
        }

        h1 {
            font-size: 32px;
        }

        .add-section {
            flex-direction: column;
            align-items: stretch;
        }

        .add-form {
            flex-direction: column;
        }

        .add-form input {
            width: 100%;
        }

        .categories-list {
            grid-template-columns: 1fr;
        }

        .category-card {
            flex-wrap: wrap;
        }

        .delete-button {
            width: 100%;
        }
    }
</style>