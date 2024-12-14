<script>
    let global = $state(false);
    let searchElement: HTMLInputElement = $state();
    let token = getToken();
    let loading = $state(false);
    let abortController: AbortController;
    let searchTimeout: number;

    function handleSearch() {
        clearTimeout(searchTimeout);
        loading = true;
        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();
        const { signal } = abortController;
        searchTimeout = setTimeout(async () => {
            let val = states.searchValue.trim();
            folderSearchStore.set({});
            fileSearchStore.set({});
            if (val === "") {
                loading = false;
                return;
            }
            if (global) {
                try {
                    await Promise.all([
                        new Promise((res) => {
                            searchHandler(
                                { mimeType: FOLDER_MIME_TYPE, search: val },
                                token,
                                signal
                            ).then((folders) => {
                                res();
                                if (val === states.searchValue.trim()) {
                                    folderSearchStore.set(folders);
                                }
                            });
                        }),
                        new Promise((res) => {
                            searchHandler(
                                { mimeType: IMG_MIME_TYPE, search: val },
                                token,
                                signal
                            ).then((files) => {
                                res();
                                if (val === states.searchValue.trim()) {
                                    fileSearchStore.set(files);
                                }
                            });
                        }),
                    ]);
                } catch (error) {
                } finally {
                    loading = false;
                }
                return;
            }
            folderSearchStore.files = folderStore.files.filter((folder) =>
                folder.name.toLowerCase().includes(val.toLowerCase())
            );
            fileSearchStore.files = fileStore.files.filter((folder) =>
                folder.name.toLowerCase().includes(val.toLowerCase())
            );
            loading = false;
        }, 500);
    }

    async function handleChange() {
        if (states.searchValue.trim() === "") {
            searchElement.focus();
            folderSearchStore.set({});
            fileSearchStore.set({});
            return;
        }
    }

    onMount(() => {
        intersectionLog.clear();
        setTimeout(() => {
            searchElement.focus();
        });
    });
    onDestroy(() => {
        intersectionLog.clear();
        folderSearchStore.set({});
        fileSearchStore.set({});
        states.searchValue = "";
    });
</script>

{#if states.mode !== "EDIT"}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="search-wrapper"
        role="form"
        onkeydown={(e) => e.stopPropagation()}
    >
        <button
            title="global"
            role="switch"
            aria-checked="false"
            class="global"
            class:active={global}
            onclick={() => {
                global = !global;
                searchElement.focus();
                handleSearch();
            }}>G</button
        >
        <input
            type="input"
            name="search"
            id="search"
            title="search"
            autocomplete="off"
            placeholder="search"
            bind:this={searchElement}
            bind:value={states.searchValue}
            oninput={handleSearch}
            onchange={handleChange}
        />
        {#if loading}
            <div class="loading">
                <Spinner width={"2rem"} height={"2rem"} borderWidth={"2px"} />
            </div>
        {:else if states.searchValue.length > 0}
            <button
                class="clear btn s-second"
                onclick={() => {
                    states.searchValue = "";
                    handleChange();
                }}
            >
                {@html clearIcon}
            </button>
        {/if}
    </div>
{/if}

<section class="search-results">
    <Content />
</section>

{#if tempStore.folderAction.type && states.searchMode}
    {#if tempStore.folderAction.type === "MOVE"}
        <Select />
    {:else}
        <ActionForm />
    {/if}
{/if}

<style>
    .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        max-width: 40rem;
        margin: auto;
        position: sticky;
        top: 1rem;
        z-index: 1;
    }
    .global {
        padding: 1.5rem;
        border: 1px solid var(--color-lite);
        border-radius: 2.5rem;
        position: absolute;
        left: 1rem;
        width: 5rem;
    }
    .global.active {
        color: var(--color-bg);
        background-color: var(--color-focus);
    }
    #search {
        width: 100%;
        height: 5rem;
        padding: 1.5rem 6rem 1.5rem 6.5rem;
        display: block;
        outline: none;
        border: none;
        border-radius: none;
        border-top-right-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        background-color: var(--color-bg-one);
        border-radius: 2.5rem;
    }

    #search:focus {
        border-bottom: 2px solid var(--color-focus);
    }

    .loading,
    .clear {
        position: absolute;
        top: 50%;
        transform: translate(0, -50%);
        right: 3rem;
        background: none;
    }
    @media (max-width: 600px) {
        .search-wrapper {
            padding: 1rem;
            top: 8rem;
        }
        #search {
            padding: 1.3rem 5rem 1.3rem 5.5rem;
            height: 4.5rem;
        }
        .global {
            padding: 1.3rem;
            width: 4.6rem;
        }

        .loading,
        .clear {
            right: 3rem;
        }
    }
</style>
