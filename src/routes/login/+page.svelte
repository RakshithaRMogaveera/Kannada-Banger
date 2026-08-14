<script lang="ts">
import { createBrowserClient } from '@supabase/ssr';
    import { goto } from '$app/navigation';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

  const supabase = createBrowserClient(
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
        email: email.trim(),
        password
    });

    if (error) {
        errorMessage = error.message;
        loading = false;

        alert(`Login failed: ${error.message}`);
        return;
    }

    if (data.user && data.session) {
        alert('Login successful! Welcome to Kannada Banger Admin.');

        await goto('/admin');
    } else {
        errorMessage = 'Login succeeded, but no session was created.';
        loading = false;

        alert('Login failed. No session was created.');
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

  /* =========================================
   MOBILE RESPONSIVE - 480px
========================================= */

@media (max-width: 480px) {

    :global(html),
    :global(body) {
        width: 100%;
        min-height: 100%;
        overflow-x: hidden;
    }

    .login-page {
        width: 100%;
        min-height: 100vh;

        padding: 20px 16px;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .login-card {
        width: 100%;
        max-width: 100%;

        padding: 30px 22px;

        border-radius: 18px;

        box-shadow:
            0 12px 30px rgba(80, 55, 35, 0.08);
    }

    .eyebrow {
        margin-bottom: 8px;

        font-size: 9px;
        letter-spacing: 3px;
    }

    h1 {
        font-size: 28px;
        line-height: 1.15;
    }

    .subtitle {
        margin: 9px 0 24px;

        font-size: 13px;
        line-height: 1.5;
    }

    form {
        gap: 8px;
    }

    label {
        margin-top: 7px;

        font-size: 13px;
    }

    input {
        width: 100%;

        padding: 12px 12px;

        border-radius: 9px;

        font-size: 13px;
    }

    input::placeholder {
        font-size: 12px;
    }

    button {
        width: 100%;

        margin-top: 13px;

        padding: 13px;

        border-radius: 9px;

        font-size: 14px;
    }

    .error {
        margin: 7px 0 0;

        font-size: 12px;
        line-height: 1.4;
    }
}
/* =========================================
   TABLET RESPONSIVE - 768px
========================================= */

@media (max-width: 768px) {

    .login-page {
        padding: 30px 24px;
    }

    .login-card {
        max-width: 460px;
        padding: 36px;
        border-radius: 20px;
    }

    .eyebrow {
        font-size: 10px;
        letter-spacing: 3.5px;
    }

    h1 {
        font-size: 32px;
    }

    .subtitle {
        margin: 10px 0 28px;
        font-size: 14px;
    }

    form {
        gap: 9px;
    }

    label {
        font-size: 13px;
    }

    input {
        padding: 13px;
        font-size: 14px;
    }

    button {
        padding: 14px;
        font-size: 14px;
    }

    .error {
        font-size: 12px;
    }
}
</style>