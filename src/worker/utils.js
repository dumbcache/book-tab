import { sync, checks } from "./drive";

const HOSTNAME = new URL(chrome.runtime.getURL("")).hostname;
export const REDIRECT_URI = `https://${HOSTNAME}.chromiumapp.org/redirect`;
export const OAUTH = `https://accounts.google.com/o/oauth2/v2/auth?client_id=443434516112-9gipi57e3v67qnp1buluec7ehrj3qdtu.apps.googleusercontent.com&prompt=select_account&response_type=token&scope=email https://www.googleapis.com/auth/drive.appdata&redirect_uri=${REDIRECT_URI}`;
/**
 * @type { chrome.tabGroups.ColorEnum[]}
 */
export const colors = [
    "grey",
    "blue",
    "red",
    "yellow",
    "green",
    "pink",
    "purple",
    "cyan",
    "orange",
];
let pendingSync;
let syncTimeOut = null;
let syncDelay = 1000 * 60 * 1;

export function checkRuntimeError() {
    chrome.runtime.lastError;
}

export function changeNofify() {
    chrome.runtime.sendMessage(
        {
            context: "CHANGE",
        },
        checkRuntimeError
    );
}

/**
 * @param {string} link
 */
export function isSystemTab(link) {
    return (
        link.startsWith("chrome://") ||
        link.startsWith("chrome-extension://") ||
        link.startsWith("chrome-search://")
    );
}

export async function getToken() {
    const { token } = await chrome.storage.local.get();
    return token;
}

export async function isSessionExpired() {
    const { session } = await chrome.storage.local.get("session");
    return session - Date.now() < 0;
}

export const login = async () => {
    const { user } = await chrome.storage.local.get("user");
    let url = OAUTH;
    if (user) url = OAUTH + `&login_hint=${user}`;

    chrome.identity.launchWebAuthFlow(
        { url: url, interactive: true },
        async (redirectURL) => {
            chrome.runtime.lastError && "";
            if (!redirectURL) {
                chrome.runtime.sendMessage(
                    {
                        context: "LOGIN",
                        status: 500,
                    },
                    checkRuntimeError
                );
                console.log("redirect failed");
                return;
            }
            const url = new URL(redirectURL);
            const token = url.hash.split("&")[0].split("=")[1];
            const { email } = await getUserInfo(token);
            checks(token, email);
            console.log("session logged in");

            // }
        }
    );
};

export const logout = async () => {
    clearTimeout(pendingSync);
    await chrome.storage.local.set({
        user: "",
        token: "",
        lastSynced: null,
        session: null,
    });
    changeNofify();
    console.log("session logged out");
};

export async function getUserInfo(token) {
    const req = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await req.json();
}

/**
 * @param {number} [length=15]
 * @returns {string}
 */
function generateId(length = 15) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    const array = new Uint8Array(length); // Create an array of random bytes
    globalThis.crypto.getRandomValues(array); // Fill the array with random bytes

    return (
        "_" +
        Array.from(array) // Map each byte to a character
            .map((value) => characters[value % charactersLength])
            .join("")
    );
}

function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

export async function display() {
    const { hidden } = await chrome.storage.local.get("hidden");
    if (hidden) return;
    chrome.tabs.query({ title: "BookTab" }).then((t) => {
        if (t.length === 0) {
            chrome.tabs.create({
                url: "/tab/index.html",
                index: 0,
                pinned: true,
                active: true,
            });
        } else if (!t[0].active) {
            chrome.tabs.update(t[0].id, { active: true });
        }
    });
}
/**
 *
 * @returns {TabGroup}
 */
function createTabGroup() {
    let d = Date.now();
    return {
        id: generateId(),
        name: new Date(d).toString(),
        createdDate: d,
        modifiedDate: d,
        locked: false,
        tabs: [],
    };
}

/**
 * @typedef {Object} Tab
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} image
 *
 */

/**
 * @typedef {Object} TabGroup
 * @property {string} id
 * @property {string} name
 * @property {number} createdDate
 * @property {number} modifiedDate
 * @property {boolean} locked
 * @property {Array<Tab>} tabs
 */

/**
 *
 * @param {chrome.tabs.Tab} tab
 * @param {string} [image]
 */
export async function add(tab, image) {
    const id = generateId();
    const t = {
        id,
        name: tab.title,
        icon: tab.favIconUrl,
        image: image ?? "",
        url: tab.url,
    };
    let { groups } = await chrome.storage.local.get();
    groups ?? (groups = []);
    if (
        groups.length === 0 ||
        Date.now() - groups[0].createdDate > 1000 * 60 * 60 * 5
    ) {
        groups.unshift(createTabGroup());
    }
    const g = groups[0];

    g.modifiedDate = Date.now();
    g.tabs.unshift(t);
    await chrome.storage.local.set({ groups });
    changeNofify();
}

/**
 * @param {chrome.tabs.Tab[]} tabs
 */
export async function addMutliple(tabs) {
    const g = createTabGroup();
    const s = new Set();
    for (const tab of tabs) {
        if (isSystemTab(tab.url)) continue;
        if (s.has(tab.url)) continue;
        s.add(tab.url);
        const id = generateId();
        const t = {
            id,
            name: tab.title,
            icon: tab.favIconUrl,
            image: "",
            url: tab.url,
        };
        g.tabs.push(t);
    }
    let { groups } = await chrome.storage.local.get();
    groups.unshift(g);
    await chrome.storage.local.set({ groups });
    changeNofify();
    for (const tab of tabs) {
        if (isSystemTab(tab.url)) continue;
        // if (s.has(tab.url)) continue;
        close(tab);
    }
}

/**
 * @param {string} group
 * @param {string} tab
 */
async function removeTab(group, tab) {
    let { groups, history = { tabs: [], groups: [] } } =
        await chrome.storage.local.get();
    const gs = groups.find((g) => g.id === group);
    const found = gs.tabs.findIndex((t) => t.id === tab);
    const ts = gs.tabs.splice(found, 1);
    gs.modifiedDate = Date.now();
    history.tabs.unshift(ts[0]);
    chrome.storage.local.set({ groups, history });
}

/**
 * @param {string} group
 */
async function removeGroup(group) {
    let { groups, history = { tabs: [], groups: [] } } =
        await chrome.storage.local.get();
    const gs = groups.filter((g) => g.id !== group);
    const f = groups.find((g) => g.id === group);
    if (f.tabs.length !== 0) {
        history.groups.unshift(f);
    }
    chrome.storage.local.set({ groups: gs, history });
}

export async function arrange({ source, sourceParent, target, targetParent }) {
    try {
        const { groups } = await chrome.storage.local.get();
        const sp = groups.find((g) => g?.id === sourceParent);
        if (!sp) return;
        let sIndex = sp.tabs.findIndex((t) => t?.id === source);
        let s = sp.tabs.splice(sIndex, 1);
        sp.modifiedDate = Date.now();
        const tp = groups.find((g) => g?.id === targetParent);
        if (!tp) return;
        let tIndex = tp.tabs.findIndex((t) => t?.id === target);
        tp.tabs.splice(tIndex, 0, s[0]);
        tp.modifiedDate = Date.now();
        await chrome.storage.local.set({ groups });
    } catch (error) {
        console.info(error);
    }
}
/**
 * @param {string} group
 * @param {string} name
 */
export async function rename(group, name) {
    const { groups } = await chrome.storage.local.get();
    const sp = groups.find((g) => g.id === group);
    if (!sp) return;
    sp.name = name;
    sp.modifiedDate = Date.now();
    await chrome.storage.local.set({ groups });
}
/**
 * @param {string} group
 * @param {boolean} locked
 */
export async function lock(group, locked) {
    const { groups } = await chrome.storage.local.get();
    const sp = groups.find((g) => g.id === group);
    if (!sp) return;
    sp.locked = locked;
    sp.modifiedDate = Date.now();
    await chrome.storage.local.set({ groups });
}

/**
 * @param {string} group
 * @param {string} tab
 */
export async function remove(group, tab) {
    if (!group) return;
    if (tab) await removeTab(group, tab);
    else await removeGroup(group);
}

/**
 * @param {string} group
 */
export async function open(group) {
    let { groups } = await chrome.storage.local.get();
    const gs = groups.find((g) => g.id === group);
    const arr = [];
    for (const t of gs.tabs) {
        if (t?.url) {
            let { id } = await chrome.tabs.create({ url: t.url });
            arr.push(id);
        }
    }
    chrome.tabs.group({ tabIds: arr }).then((gid) =>
        chrome.tabGroups.update(gid, {
            title: gs.name,
            color: getRandomColor(),
            collapsed: true,
        })
    );
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function close(tab) {
    chrome.tabs.remove(tab.id);
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendOne(tab, image, closed) {
    if (isSystemTab(tab.url)) return;
    add(tab, image);
    if (closed) close(tab);
}

export function sendAll() {
    chrome.windows.getAll().then((ws) => {
        ws.forEach((w) => {
            chrome.tabs.query({ windowId: w.id }, (tabs) => {
                addMutliple(tabs);
            });
        });
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendExcept(tab) {
    chrome.tabs.query({}, (tabs) => {
        const ts = tabs.filter((t) => {
            if (isSystemTab(t.url)) return false;
            if (t.index === tab.index) return false;
            return true;
        });
        addMutliple(ts);
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendLeft(tab) {
    chrome.tabs.query({}, (tabs) => {
        const ts = tabs.filter((t) => {
            if (isSystemTab(t.url)) return false;
            if (t.index >= tab.index) return false;
            return true;
        });
        addMutliple(ts);
    });
}

/**
 *
 * @param {chrome.tabs.Tab} tab
 */
export function sendRight(tab) {
    chrome.tabs.query({}, (tabs) => {
        const ts = tabs.filter((t) => {
            if (isSystemTab(t.url)) return false;
            if (t.index <= tab.index) return false;
            return true;
        });
        addMutliple(ts);
    });
}

export function clearHistory() {
    chrome.storage.local
        .set({
            history: { groups: [], tabs: [] },
        })
        .then(changeNofify);
}
/*********************************************************************
 *********************************************************************
 **********************  HANDLERS ************************************
 *********************************************************************
 *********************************************************************/
export function initContextMenus() {
    chrome.contextMenus.create({
        id: "booktab",
        title: "BookTab",
        contexts: ["all"],
    });
    chrome.contextMenus.create(
        {
            id: "display",
            title: "Display BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "create",
            title: "Create a copy of this tab",
            contexts: ["image", "link", "page"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "seperator1",
            type: "separator",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendOne",
            title: "Send only this tab to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendLink",
            title: "Send this link to BookTab",
            contexts: ["link"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "seperator2",
            type: "separator",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendAll",
            title: "Send all tabs to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendExcept",
            title: "Send all tabs except this tab to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendLeft",
            title: "Send all tabs on left to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "sendRight",
            title: "Send all tabs on right to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );

    chrome.contextMenus.create(
        {
            id: "seperator3",
            type: "separator",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create({
        id: "options",
        title: "Options",
        parentId: "booktab",
        contexts: ["all"],
    });
    chrome.contextMenus.create(
        {
            id: "hidden",
            title: "Hidden",
            contexts: ["all"],
            type: "checkbox",
            parentId: "options",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "clearHistory",
            title: "Clear history of BookTab",
            contexts: ["all"],
            parentId: "options",
        },
        checkRuntimeError
    );
}

export async function setStorage() {
    let {
        groups = [],
        history = { groups: [], tabs: [] },
        theme = "",
        hidden = false,
        user,
        token,
        session,
        lastSynced,
    } = await chrome.storage.local.get();
    chrome.storage.local.set({
        groups,
        history,
        theme,
        hidden,
        user,
        token,
        session,
        lastSynced,
    });
}

/**
 * @param {boolean} b
 */
export function setSidePanelBehavior(b) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: b });
    chrome.sidePanel.setOptions({
        enabled: b,
    });
}

export async function installHandler() {
    initContextMenus();
    setStorage();
    setSidePanelBehavior(true);
    console.log("installed");
}

export function startupHandler() {
    console.log("started");
}

export async function storageHandler(changes) {
    try {
        if (changes.groups || changes.history) {
            if (Date.now() - syncTimeOut > syncDelay) {
                syncTimeOut = Date.now();
                if (!(await isSessionExpired())) {
                    console.log("Sync is in queue");
                    pendingSync = setTimeout(() => {
                        sync();
                    }, syncDelay);
                }
            }
        }
    } catch (error) {
        console.warn("Storage onChange error", error);
    }
}

/**
 *
 * @param { chrome.contextMenus.OnClickData} info
 * @param { chrome.tabs.Tab} tab
 */
export function contextMenuHandler(info, tab) {
    performContextAction(info.menuItemId, tab, info);
}
/**
 * @param {string | number} action
 * @param { chrome.tabs.Tab} tab
 * @param { chrome.contextMenus.OnClickData} [info]
 */
export function performContextAction(action, tab, info) {
    try {
        switch (action) {
            case "create":
                // chrome.sidePanel.open({ windowId: tab.windowId });
                sendOne(tab, info?.srcUrl, false);
                return;
            case "display":
                display();
                return;

            case "sendOne":
                sendOne(tab, info?.srcUrl, true);
                return;
            case "sendLink":
                chrome.tabs
                    .create({
                        url: info.linkUrl,
                        active: false,
                        pinned: true,
                    })
                    .then((p) => {
                        chrome.tabs.onUpdated.addListener(function onTabUpdated(
                            tid,
                            changeInfo,
                            t
                        ) {
                            if (
                                p.id === tid &&
                                changeInfo.status === "complete"
                            ) {
                                chrome.tabs.get(tid, (tt) => {
                                    sendOne(tt, "", true);
                                });
                                chrome.tabs.onUpdated.removeListener(
                                    onTabUpdated
                                );
                            }
                        });
                    });

                return;
            case "sendAll":
                sendAll();
                return;
            case "sendExcept":
                sendExcept(tab);
                return;
            case "sendLeft":
                sendLeft(tab);
                return;
            case "sendRight":
                sendRight(tab);
                return;
            case "hidden":
                chrome.storage.local.set({ hidden: info.checked });
                setSidePanelBehavior(!info.checked);

                return;
            case "clearHistory":
                clearHistory();
                return;
        }
    } catch (error) {
        console.warn("ContextMenu error:", error);
    }
}

/**
 *
 * @param {any} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {(response?: any) => void} sendResponse
 */
export function messageHandler(message, sender, sendResponse) {
    performMessageAction(message, sendResponse);
}
/**
 *
 * @param {any} message
 * @param {(response?: any) => void} sendResponse
 */
function performMessageAction(message, sendResponse) {
    try {
        // if (sender.tab &&isSystemTab(sender.tab.url)) return;
        if (message.context === "LOGIN") {
            login();
            return;
        }
        if (message.context === "LOGOUT") {
            logout();
            return;
        }
        if (message.context === "OPEN") {
            const { group } = message.data;
            open(group);
            return;
        }
        if (message.context === "REMOVE") {
            const { group, tab } = message.data;
            remove(group, tab).then(changeNofify);
            return;
        }
        if (message.context === "ARRANGE") {
            arrange(message.data);
            return;
        }
        if (message.context === "RENAME") {
            const { group, name } = message.data;
            rename(group, name);
            return;
        }
        if (message.context === "LOCK") {
            const { group, locked } = message.data;
            lock(group, locked);
            return;
        }
        if (message.context === "CONTEXTMENU") {
            chrome.tabs
                .query({ active: true, lastFocusedWindow: true })
                .then((ts) => {
                    sendOne(ts[0], "", false);
                    performContextAction(message.action, ts[0]);
                });
            return;
        }
    } catch (error) {
        console.warn("OnMessage error:", error);
    }
}
