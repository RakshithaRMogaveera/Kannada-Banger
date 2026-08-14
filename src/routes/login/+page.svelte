<script lang="ts">
    import { createClient } from '@supabase/supabase-js';
    import { goto } from '$app/navigation';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

    const supabase = createClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    let email = '';
    let password = '';
    let errorMessage = '';
    let loading = false;

    async function login() {
        errorMessage = '';
        loading = true;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            errorMessage = error.message;
            loading = false;
            return;
        }

        if (data.user) {
            goto('/admin');
        }
    }
</script>

<svelte:head>
    <title>Admin Login | Kannada Banger</title>
</svelte:head>

<div class="login-page">

    <div class="login-card">

        <p class="eyebrow">KANNADA BANGER</p>

        <h1>Admin Login</h1>

        <p class="subtitle">
            Sign in to manage your music collection.
        </p>

        <form onsubmit={(e) => {
            e.preventDefault();
            login();
        }}>

            <label for="email">Email</label>

            <input
                id="email"
                type="email"
                bind:value={email}
                placeholder="Enter your email"
                required
            />

            <label for="password">Password</label>

            <input
                id="password"
                type="password"
                bind:value={password}
                placeholder="Enter your password"
                required
            />

            {#if errorMessage}
                <p class="error">{errorMessage}</p>
            {/if}

            <button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
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

    .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px 20px;
    }

    .login-card {
        width: 100%;
        max-width: 420px;
        padding: 40px;
        background: white;
        border: 1px solid #e5ddd4;
        border-radius: 22px;
        box-shadow: 0 15px 40px rgba(80, 55, 35, 0.08);
    }

    .eyebrow {
        margin: 0 0 10px;
        font-size: 11px;
        letter-spacing: 4px;
        color: #8a684e;
        font-weight: 700;
    }

    h1 {
        margin: 0;
        color: #2d241e;
        font-size: 34px;
    }

    .subtitle {
        margin: 10px 0 30px;
        color: #75685e;
        font-size: 15px;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    label {
        margin-top: 8px;
        color: #4b4038;
        font-size: 14px;
        font-weight: 600;
    }

    input {
        width: 100%;
        padding: 13px 14px;
        border: 1px solid #ddd2c7;
        border-radius: 10px;
        outline: none;
        font-size: 14px;
        color: #2d241e;
        background: #faf8f5;
    }

    input:focus {
        border-color: #9b7658;
    }

    button {
        margin-top: 15px;
        padding: 14px;
        border: none;
        border-radius: 10px;
        background: #6f4a32;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
    }

    button:hover {
        background: #5d3d29;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error {
        margin: 8px 0 0;
        color: #b33a3a;
        font-size: 13px;
    }

    @media (max-width: 500px) {
        .login-card {
            padding: 30px 24px;
        }

        h1 {
            font-size: 30px;
        }
    }
</style>