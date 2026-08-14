<script lang="ts">
    import { onMount } from 'svelte';
    import YouTubePlayer from 'youtube-player';
    import { createClient } from '@supabase/supabase-js';
    import {
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } from '$env/static/public';

    let player: any = null;

    let songs = $state<any[]>([]);
    let currentIndex = $state(0);

    let isPlaying = $state(false);
    let currentTime = $state(0);
    let duration = $state(0);

    let videoId = $state('');
    let songTitle = $state('');
    let artist = $state('');
    let thumbnail = $state('');

    let isReady = false;

   // Category selected for displaying songs
let selectedCategory = $state('All Songs');

// Show / hide categories and song list
let showLibrary = $state(false);

    // Categories loaded from Supabase
    let categoryList = $state<string[]>([]);

    // Category currently being used for automatic playback
    let playbackCategory = $state('All Songs');

    // Category buttons
    const categories = $derived([
        'All Songs',
        ...categoryList
    ]);

    // Songs shown in the library
    const filteredSongs = $derived(
        selectedCategory === 'All Songs'
            ? songs
            : songs.filter((song) =>
                  Array.isArray(song.categories) &&
                  song.categories.includes(selectedCategory)
              )
    );

    // Volume
    let volume = $state(100);
    let showVolume = $state(false);

    onMount(() => {
        let progressTimer: ReturnType<typeof setInterval> | undefined;

        const loadSongs = async () => {
            const supabase = createClient(
                PUBLIC_SUPABASE_URL,
                PUBLIC_SUPABASE_PUBLISHABLE_KEY
            );

            // Load categories
            const {
                data: categoryData,
                error: categoryError
            } = await supabase
                .from('categories')
                .select('name')
                .order('id', { ascending: true });

            if (categoryError) {
                console.error(
                    'Error loading categories:',
                    categoryError
                );
            } else {
                categoryList =
                    categoryData
                        ?.map((category) => category.name)
                        .filter(
                            (name) =>
                                name &&
                                name !== 'All Songs'
                        ) ?? [];
            }

            // Load songs
            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.error(
                    'Error loading songs:',
                    error
                );
                return;
            }

            if (!data || data.length === 0) {
                console.error('No songs found.');
                return;
            }

            songs = data;

            // Restore the last played song
const savedSongId = localStorage.getItem(
    'lastPlayedSongId'
);

const savedPlaybackCategory =
    localStorage.getItem(
        'lastPlaybackCategory'
    );

let savedSongIndex = -1;

if (savedSongId) {
    savedSongIndex = songs.findIndex(
        (song) =>
            String(song.id) === savedSongId
    );
}

if (savedSongIndex !== -1) {
    currentIndex = savedSongIndex;
} else {
    currentIndex = 0;
}

if (savedPlaybackCategory) {
    playbackCategory =
        savedPlaybackCategory;
} else {
    playbackCategory = 'All Songs';
}

const initialSong =
    songs[currentIndex];

videoId = initialSong.youtube_id;
songTitle = initialSong.title;
artist = initialSong.artist;

thumbnail =
    initialSong.cover_url ||
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            // Create YouTube player
            player = YouTubePlayer('youtube-player', {
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0
                }
            });

            // Player ready
            player.on('ready', async () => {
                isReady = true;
                duration = await player.getDuration();
                await player.setVolume(volume);
            });

            // Player state changes
            player.on(
                'stateChange',
                async (event: any) => {
                    // Playing
                    if (event.data === 1) {
                        isPlaying = true;
                        duration =
                            await player.getDuration();
                    }

                    // Paused
                    else if (event.data === 2) {
                        isPlaying = false;
                    }

                    // Song ended
                    else if (event.data === 0) {
                        isPlaying = false;
                        currentTime = 0;

                        // Automatically move to the next
                        // song from the CURRENT playback category
                        await nextSong(true);
                    }
                }
            );

            // Update progress
            progressTimer = setInterval(
                async () => {
                    if (player && isPlaying) {
                        currentTime =
                            await player.getCurrentTime();

                        duration =
                            await player.getDuration();
                    }
                },
                500
            );
        };

        loadSongs();

        return () => {
            if (progressTimer) {
                clearInterval(progressTimer);
            }

            player?.destroy();
        };
    });

    // Update player information
    const updateSongInfo = (song: any) => {
        videoId = song.youtube_id;
        songTitle = song.title;
        artist = song.artist;

        thumbnail =
            song.cover_url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        currentTime = 0;
        duration = 0;
    };

    // Play a specific song
    const playSong = async (
        index: number,
        autoplay = false
    ) => {
        if (!player || !songs.length) return;

        currentIndex = index;

        const song = songs[currentIndex];

        updateSongInfo(song);

        await player.loadVideoById(
            song.youtube_id
        );

        if (autoplay) {
            await player.playVideo();
            isPlaying = true;
        } else {
            isPlaying = false;
        }
    };

    // Play / Pause
    const togglePlay = async () => {
        if (!player || !isReady) return;

        if (isPlaying) {
            await player.pauseVideo();
            isPlaying = false;
        } else {
            await player.playVideo();
            isPlaying = true;
        }
    };

    // Volume popup
    const toggleVolume = () => {
        showVolume = !showVolume;
    };

    // Change volume
    const changeVolume = async (event: Event) => {
        if (!player) return;

        const input =
            event.currentTarget as HTMLInputElement;

        const newVolume = Number(input.value);

        volume = newVolume;

        await player.setVolume(newVolume);
    };

    // User clicks a song
    const selectSong = async (song: any) => {
        const index = songs.findIndex(
            (item) => item.id === song.id
        );

        if (index === -1) return;

        /*
         * IMPORTANT:
         * Clicking a category button alone does NOT
         * change playback.
         *
         * Playback category changes ONLY when the user
         * actually clicks a song.
         */

        if (selectedCategory === 'All Songs') {
            playbackCategory = 'All Songs';
        } else {
            const songCategories =
                Array.isArray(song.categories)
                    ? song.categories
                    : [];

            if (
                songCategories.includes(
                    selectedCategory
                )
            ) {
                playbackCategory =
                    selectedCategory;
            } else {
                playbackCategory = 'All Songs';
            }
        }

        await playSong(index, true);
        localStorage.setItem(
    'lastPlayedSongId',
    String(song.id)
);

localStorage.setItem(
    'lastPlaybackCategory',
    playbackCategory
);
    };

    // Get songs belonging to the current playback category
    const getPlaybackSongs = () => {
        if (playbackCategory === 'All Songs') {
            return songs;
        }

        return songs.filter((song) =>
            Array.isArray(song.categories) &&
            song.categories.includes(
                playbackCategory
            )
        );
    };

    // Next song
    const nextSong = async (
        autoplay = false
    ) => {
        if (!songs.length) return;

        const playbackSongs =
            getPlaybackSongs();

        if (!playbackSongs.length) return;

        const currentSong =
            songs[currentIndex];

        let playbackIndex =
            playbackSongs.findIndex(
                (song) =>
                    song.id === currentSong?.id
            );

        // If current song is not in the
        // playback category, start from first
        if (playbackIndex === -1) {
            playbackIndex = 0;
        } else {
            playbackIndex =
                playbackIndex ===
                playbackSongs.length - 1
                    ? 0
                    : playbackIndex + 1;
        }

        const nextSongData =
            playbackSongs[playbackIndex];

        const nextIndex =
            songs.findIndex(
                (song) =>
                    song.id === nextSongData.id
            );

       await playSong(
    nextIndex,
    autoplay
);

localStorage.setItem(
    'lastPlayedSongId',
    String(nextSongData.id)
);

localStorage.setItem(
    'lastPlaybackCategory',
    playbackCategory
);
    };

    // Previous song
    const previousSong = async () => {
        if (!songs.length) return;

        const playbackSongs =
            getPlaybackSongs();

        if (!playbackSongs.length) return;

        const currentSong =
            songs[currentIndex];

        let playbackIndex =
            playbackSongs.findIndex(
                (song) =>
                    song.id === currentSong?.id
            );

        if (playbackIndex === -1) {
            playbackIndex = 0;
        } else {
            playbackIndex =
                playbackIndex === 0
                    ? playbackSongs.length - 1
                    : playbackIndex - 1;
        }

        const previousSongData =
            playbackSongs[playbackIndex];

        const previousIndex =
            songs.findIndex(
                (song) =>
                    song.id ===
                    previousSongData.id
            );

       await playSong(
    previousIndex,
    true
);

localStorage.setItem(
    'lastPlayedSongId',
    String(previousSongData.id)
);

localStorage.setItem(
    'lastPlaybackCategory',
    playbackCategory
);
    };

    // Seek using progress bar
    const seek = async (
        event: MouseEvent
    ) => {
        if (!player || !duration) return;

        const bar =
            event.currentTarget as HTMLElement;

        const rect =
            bar.getBoundingClientRect();

        const clickPosition =
            event.clientX - rect.left;

        const percentage = Math.max(
            0,
            Math.min(
                1,
                clickPosition / rect.width
            )
        );

        const newTime =
            percentage * duration;

        await player.seekTo(
            newTime,
            true
        );

        currentTime = newTime;
    };

    // Keyboard controls for progress bar
    const handleProgressKeydown = async (
        event: KeyboardEvent
    ) => {
        if (!player || !duration) return;

        if (
            event.key !== 'ArrowLeft' &&
            event.key !== 'ArrowRight'
        ) {
            return;
        }

        event.preventDefault();

        const step = 5;

        let newTime = currentTime;

        if (
            event.key === 'ArrowRight'
        ) {
            newTime = Math.min(
                duration,
                currentTime + step
            );
        } else {
            newTime = Math.max(
                0,
                currentTime - step
            );
        }

        await player.seekTo(
            newTime,
            true
        );

        currentTime = newTime;
    };

    // Format time
    const formatTime = (
        seconds: number
    ) => {
        if (
            !seconds ||
            !isFinite(seconds)
        ) {
            return '0:00';
        }

        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            Math.floor(seconds % 60);

        return `${minutes}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
    };
</script>

<!------------------------frontend --------------------------->
<div id="youtube-player" class="youtube-player"></div>

<div class="player">
    <div class="cover">
        {#if thumbnail}
            <img src={thumbnail} alt={songTitle} />
        {/if}
    </div>

    <div class="song-section">
        <div class="song-info">
            <h2>{songTitle || 'Loading...'}</h2>
            <p>{artist || 'Loading...'}</p>
        </div>

        <div class="progress-row">
            <div
                class="progress-container"
                onclick={seek}
                onkeydown={handleProgressKeydown}
                role="slider"
                aria-label="Song progress"
                aria-valuemin="0"
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                tabindex="0"
            >
                <div
                    class="progress"
                    style={`width: ${
                        duration
                            ? (currentTime / duration) * 100
                            : 0
                    }%`}
                ></div>

                <div
                    class="progress-dot"
                    style={`left: ${
                        duration
                            ? (currentTime / duration) * 100
                            : 0
                    }%`}
                ></div>
            </div>

            <span class="time">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
        </div>
    </div>

    <div class="controls">

    <button
        class="skip-button"
        aria-label="Previous song"
        type="button"
        onclick={previousSong}
    >
        <span class="previous-icon"></span>
    </button>

    <button
        class="play-button"
        onclick={togglePlay}
        aria-label={isPlaying ? 'Pause song' : 'Play song'}
        type="button"
    >
        {#if isPlaying}
            <span class="pause-icon"></span>
        {:else}
            <span class="play-icon"></span>
        {/if}
    </button>

    <button
        class="skip-button"
        aria-label="Next song"
        type="button"
        onclick={() => nextSong(true)}
    >
        <span class="next-icon"></span>
    </button>

        <div class="volume-control">
            <button
                class="volume-button"
                type="button"
                aria-label="Volume"
                aria-expanded={showVolume}
                onclick={toggleVolume}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4z"></path>

                    {#if volume === 0}
                        <path d="M16 9l5 6"></path>
                        <path d="M21 9l-5 6"></path>
                    {:else if volume <= 50}
                        <path d="M16 9.5c.6.7.9 1.5.9 2.5s-.3 1.8-.9 2.5"></path>
                    {:else}
                        <path d="M16 8c1.1 1 1.7 2.2 1.7 4s-.6 3-1.7 4"></path>
                        <path d="M19 5.5c1.8 1.8 2.8 4 2.8 6.5s-1 4.7-2.8 6.5"></path>
                    {/if}
                </svg>
            </button>

            {#if showVolume}
                <div class="volume-popup">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={volume}
                        oninput={changeVolume}
                        aria-label="Volume level"
                    />

                    <span>{volume}%</span>
                </div>
            {/if}
        </div>
    </div>
</div>
<button
    type="button"
    class="view-more-button"
    onclick={() => showLibrary = !showLibrary}
    aria-expanded={showLibrary}
>
    {showLibrary ? 'VIEW LESS' : 'VIEW MORE'}
</button>

{#if showLibrary}
    <div class="library">
        <div class="category-list">
            {#each categories as category}
                <button
                    type="button"
                    class:active={selectedCategory === category}
                    onclick={() => selectedCategory = category}
                >
                    {category}
                </button>
            {/each}
        </div>

        <div class="song-list">
            {#each filteredSongs as song}
                <button
                    type="button"
                    class="song-item"
                    class:current={songs[currentIndex]?.id === song.id}
                    onclick={() => selectSong(song)}
                >
                    <div class="song-thumbnail">
                        <img
                            src={
                                song.cover_url ||
                                `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
                            }
                            alt={song.title}
                        />
                    </div>

                    <div class="song-details">
                        <h3>{song.title}</h3>
                        <p>{song.artist}</p>
                    </div>

                    {#if songs[currentIndex]?.id === song.id}
                        <span class="playing-indicator">♫</span>
                    {/if}
                </button>
            {/each}
        </div>
    </div>
{/if}

<!------------- css-------------------------- -->
<style>
    .player {
    width: min(450px, 70vw);
    min-height: 78px;
    height: 78px;

    display: flex;
    align-items: center;
    gap: 18px;

    padding: 10px 24px 10px 10px;

    border-radius: 55px;

    background:
        linear-gradient(
            110deg,
            rgba(125, 74, 42, 0.92),
            rgba(145, 91, 58, 0.82),
            rgba(76, 83, 79, 0.88)
        );

    box-shadow:
        0 12px 30px rgba(0, 0, 0, 0.25);

    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);

    color: white;
}


.cover {
    flex-shrink: 0;

  width: 58px;
    height: 58px;

    overflow: hidden;
    border-radius: 50%;

    background: #222;

    box-shadow:
        0 4px 14px rgba(0, 0, 0, 0.35);
}
    .cover img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .song-section {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
    }

    .song-info h2 {
       margin: 0;
    font-size: 16px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-info p {
        margin: 3px 0 0;
    font-size: 12px;
        opacity: 0.65;
    }

    .progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    .progress-container {
        position: relative;
        flex: 1;
        height: 5px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.25);
        cursor: pointer;
    }

    .progress {
        height: 100%;
        border-radius: 999px;
        background: white;
        transition: width 0.3s linear;
    }

    .progress-dot {
        position: absolute;
        top: 50%;
        width: 12px;
    height: 12px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: white;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.2);
        pointer-events: none;
    }

    .time {
        flex-shrink: 0;
        font-size: 10px;
        opacity: 0.75;
        white-space: nowrap;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .play-button {
         width: 48px;
    height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 50%;
        background: white;
        color: black;
        font-size: 16px;
        cursor: pointer;
        transition:
            transform 0.2s ease,
            background 0.2s ease;
    }

    .play-button:hover {
        transform: scale(1.06);
    }
.play-icon {
    width: 0;
    height: 0;

    margin-left: 3px;

    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 11px solid currentColor;
}

.pause-icon {
    width: 10px;
    height: 14px;

    border-left: 3px solid currentColor;
    border-right: 3px solid currentColor;
}
   .skip-button {
    width: 26px;
    height: 26px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;
    border: none;
    background: transparent;

    color: white;
    opacity: 0.85;

    cursor: pointer;

    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}
.previous-icon,
.next-icon {
    position: relative;
    width: 15px;
    height: 14px;
    display: block;
}

.previous-icon::before,
.next-icon::before {
    content: '';
    position: absolute;
    top: 2px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
}

.previous-icon::after,
.next-icon::after {
    content: '';
    position: absolute;
    top: 2px;
    width: 2px;
    height: 10px;
    background: currentColor;
    border-radius: 1px;
}

/* Previous */
.previous-icon::before {
    left: 1px;
    border-right: 7px solid currentColor;
}

.previous-icon::after {
    right: 1px;
}

/* Next */
.next-icon::before {
    right: 1px;
    border-left: 7px solid currentColor;
}

.next-icon::after {
    left: 1px;
}
    .skip-button:hover {
        opacity: 1;
        transform: scale(1.1);
    }

    .youtube-player {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }
.volume-control {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.volume-button {
   width: 28px;
    height: 28px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;
    border: none;
    background: transparent;

    color: rgba(255, 255, 255, 0.8);

    cursor: pointer;

    transition:
        color 0.2s ease,
        transform 0.2s ease;
}

.volume-button:hover {
    color: white;
    transform: scale(1.1);
}

.volume-button svg {
     width: 17px;
    height: 17px;

    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.volume-popup {
    position: absolute;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);

    width: 52px;
    height: 150px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    border-radius: 12px;

    background: rgba(25, 25, 25, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);

    z-index: 20;
}

.volume-popup input[type="range"] {
    width: 115px;
    height: 5px;

    transform: rotate(-90deg);

    appearance: none;
    -webkit-appearance: none;

    background: rgba(255, 255, 255, 0.3);

    border-radius: 999px;

    cursor: pointer;
}

.volume-popup input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;

    width: 14px;
    height: 14px;

    border-radius: 50%;
    border: none;

    background: white;

    cursor: pointer;
}

.volume-popup input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;

    border-radius: 50%;
    border: none;

    background: white;

    cursor: pointer;
}

.volume-popup span {
    color: white;
    font-size: 10px;
    opacity: 0.7;
}
.view-more-button {
    margin-top: 10px;
    padding: 5px 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 6px;
    font-weight: 100;
    letter-spacing: 1.5px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition:
        background 0.2s ease,
        transform 0.2s ease,
        border-color 0.2s ease;
}

.view-more-button:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.45);
    transform: translateY(-2px);
}
.library {
    width: min(850px, 85vw);
    margin-top: 24px;
}

.category-list {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    overflow-x: auto;
    scrollbar-width: none;
}

.category-list::-webkit-scrollbar {
    display: none;
}

.category-list button {
    flex-shrink: 0;
    padding: 9px 18px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition:
        background 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

.category-list button:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
}

.category-list button.active {
    background: white;
    color: #5b3928;
}

.song-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 5px;
}

.song-list::-webkit-scrollbar {
    width: 5px;
}

.song-list::-webkit-scrollbar-track {
    background: transparent;
}

.song-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 999px;
}

.song-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.08);
    color: white;
    text-align: left;
    cursor: pointer;
    transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;
}

.song-item:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(3px);
}

.song-item.current {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.25);
}

.song-thumbnail {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.2);
}

.song-thumbnail img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.song-details {
    flex: 1;
    min-width: 0;
}

.song-details h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.song-details p {
    margin: 4px 0 0;
    font-size: 12px;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.playing-indicator {
    flex-shrink: 0;
    font-size: 20px;
    opacity: 0.9;
}

    /* =========================
   MOBILE RESPONSIVE DESIGN
   ========================= */

@media (max-width: 480px) {

    .player {
        width: calc(100vw - 28px);
        min-height: 64px;
        height: 64px;

        gap: 8px;

        padding: 7px 9px 7px 7px;

        border-radius: 38px;
    }

    .cover {
        width: 48px;
        height: 48px;
    }

    .song-section {
        gap: 4px;
        min-width: 0;
    }

    .song-info h2 {
        font-size: 13px;
        line-height: 16px;
    }

    .song-info p {
        margin-top: 1px;
        font-size: 9px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .progress-row {
        gap: 5px;
    }

    .progress-container {
        height: 4px;
    }

    .progress-dot {
        width: 9px;
        height: 9px;
    }

    .time {
        font-size: 8px;
    }

    .controls {
        gap: 3px;
    }

    .play-button {
        width: 40px;
        height: 40px;
        font-size: 14px;
        flex-shrink: 0;
    }

    .skip-button {
        width: 21px;
        height: 21px;
        font-size: 11px;
        flex-shrink: 0;
    }

    .volume-button {
        width: 22px;
        height: 22px;
    }

    .volume-button svg {
        width: 15px;
        height: 15px;
    }

    .volume-popup {
        bottom: 42px;
        width: 45px;
        height: 125px;
    }

    .volume-popup input[type="range"] {
        width: 90px;
    }

    .view-more-button {
        margin-top: 7px;
        padding: 4px 9px;
        font-size: 6px;
        letter-spacing: 1.2px;
    }


    /* =========================
       SONG LIBRARY
       ========================= */

    .library {
        width: calc(100vw - 28px);
        margin-top: 18px;
    }

    .category-list {
        gap: 7px;
        margin-bottom: 11px;
        padding-bottom: 2px;
    }

    .category-list button {
        padding: 7px 13px;
        font-size: 11px;
    }

    .song-list {
        gap: 6px;
        max-height: 260px;
        padding-right: 2px;
    }

    .song-list::-webkit-scrollbar {
        width: 3px;
    }

    .song-item {
        gap: 9px;
        padding: 7px 9px;
        border-radius: 12px;
    }

    .song-thumbnail {
        width: 42px;
        height: 42px;
        border-radius: 8px;
    }

    .song-details h3 {
        font-size: 12px;
    }

    .song-details p {
        margin-top: 2px;
        font-size: 9px;
    }

    .playing-indicator {
        font-size: 16px;
    }
}
/* ================================
   TABLET RESPONSIVE - 768px
================================ */

@media (max-width: 768px) {

    .player {
        width: min(520px, 88vw);
        min-height: 74px;
        height: 74px;
        gap: 14px;
        padding: 8px 18px 8px 8px;
    }

    .cover {
        width: 54px;
        height: 54px;
    }

    .song-info h2 {
        font-size: 15px;
    }

    .song-info p {
        font-size: 11px;
    }

    .controls {
        gap: 7px;
    }

    .play-button {
        width: 44px;
        height: 44px;
        font-size: 15px;
    }

    .skip-button {
        width: 24px;
        height: 24px;
        font-size: 13px;
    }

    .volume-button {
        width: 25px;
        height: 25px;
    }

    .volume-button svg {
        width: 16px;
        height: 16px;
    }

    .library {
        width: 88vw;
        margin-top: 20px;
    }

    .category-list {
        gap: 8px;
        margin-bottom: 14px;
    }

    .category-list button {
        padding: 8px 15px;
        font-size: 12px;
    }

    .song-list {
        max-height: 280px;
        gap: 7px;
    }

    .song-item {
        gap: 12px;
        padding: 8px 12px;
        border-radius: 13px;
    }

    .song-thumbnail {
        width: 48px;
        height: 48px;
    }

    .song-details h3 {
        font-size: 14px;
    }

    .song-details p {
        font-size: 11px;
    }

    .playing-indicator {
        font-size: 18px;
    }
}


/* ================================
   MOBILE RESPONSIVE - 600px
================================ */

@media (max-width: 600px) {

    .player {
        width: 92vw;
        min-height: 70px;
        height: 70px;
        gap: 10px;
        padding: 7px 12px 7px 7px;
        border-radius: 45px;
    }

    .cover {
        width: 50px;
        height: 50px;
    }

    .song-section {
        gap: 4px;
    }

    .song-info h2 {
        font-size: 14px;
    }

    .song-info p {
        margin-top: 2px;
        font-size: 10px;
    }

    .progress-row {
        gap: 5px;
    }

    .progress-container {
        height: 4px;
    }

    .progress-dot {
        width: 10px;
        height: 10px;
    }

    .time {
        font-size: 9px;
    }

    .controls {
        gap: 4px;
    }

    .play-button {
        width: 40px;
        height: 40px;
        font-size: 14px;
    }

  .skip-button {
    width: 22px;
    height: 22px;
}

    .volume-button {
        width: 23px;
        height: 23px;
    }

    .volume-button svg {
        width: 15px;
        height: 15px;
    }

    .volume-popup {
        bottom: 44px;
        width: 48px;
        height: 135px;
    }

    .library {
        width: 92vw;
        margin-top: 18px;
    }

    .category-list {
        gap: 7px;
        margin-bottom: 12px;
        padding-bottom: 2px;
    }

    .category-list button {
        padding: 7px 13px;
        font-size: 11px;
    }

    .song-list {
        max-height: 260px;
        gap: 6px;
        padding-right: 2px;
    }

    .song-item {
        gap: 10px;
        padding: 7px 10px;
        border-radius: 12px;
    }

    .song-thumbnail {
        width: 44px;
        height: 44px;
        border-radius: 8px;
    }

    .song-details h3 {
        font-size: 13px;
    }

    .song-details p {
        margin-top: 3px;
        font-size: 10px;
    }

    .playing-indicator {
        font-size: 17px;
    }

    .view-more-button {
        margin-top: 8px;
        padding: 5px 9px;
        font-size: 6px;
    }
}
</style>