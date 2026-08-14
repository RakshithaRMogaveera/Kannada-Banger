<script lang="ts">
    import { onMount } from 'svelte';
    import MusicPlayer from '../components/MusicPlayer.svelte';

    let currentTime = $state(
        new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    );

    onMount(() => {
        const updateClock = () => {
            currentTime = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        const timer = setInterval(updateClock, 1000);

        return () => clearInterval(timer);
    });
</script>

<svelte:head>
    <title>Kannada Banger</title>
    <meta
        name="description"
        content="A collection of timeless Kannada bangers."
    />
</svelte:head>

<div class="page">
    <div class="background"></div>

    <div class="clock">
        <span class="clock-icon">◷</span>
        <span>{currentTime}</span>
    </div>

    <main class="content">
        <div class="brand">
            <p class="eyebrow">OLD KANNADA • NEW MEMORIES</p>

            <h1>ಕನ್ನಡ BANGER</h1>

            <p class="tagline">Timeless songs. Endless memories.</p>
        </div>

        <MusicPlayer />
    </main>
</div>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@400;500;600;700;800&family=Baloo+Tamma+2:wght@400;500;600;700;800&family=Noto+Serif+Kannada:wght@400;500;600;700;800&family=Tiro+Kannada:ital@0;1&display=swap');
    :global(html, body) {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;
    }

    :global(body) {
        overflow-x: hidden;
        overflow-y: auto;
        font-family: Arial, sans-serif;
    }

    .page {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: visible;
        background: #111;
    }

   .background {
    position: fixed;
    inset: 0;
    z-index: 0;
    background-image:
        linear-gradient(
            rgba(0, 0, 0, 0.35),
            rgba(0, 0, 0, 0.35)
        ),
        url('/images/bg.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
}

    .clock {
        position: absolute;
        top: 30px;
        left: 30px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 1px;
    }

    .clock-icon {
        font-size: 21px;
        line-height: 1;
        opacity: 0.9;
    }

    .content {
        position: relative;
        z-index: 1;
        width: 100%;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 40px;
        padding: 100px 20px 60px;
        text-align: center;
    }

    .brand {
        color: white;
    }

    .eyebrow {
        margin: 0 0 12px;
        font-size: 11px;
        letter-spacing: 4px;
        opacity: 0.6;
    }

    h1 {
        margin: 0;
        font-size: clamp(48px, 9vw, 120px);
        line-height: 0.9;
        letter-spacing: -4px;
    }

    .tagline {
        margin: 18px 0 0;
        font-size: 14px;
        opacity: 0.6;
        letter-spacing: 1px;
    }
</style>