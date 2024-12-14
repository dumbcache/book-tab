import { checks } from "./drive";

const HOSTNAME = new URL(chrome.runtime.getURL("")).hostname;
export const REDIRECT_URI = `https://${HOSTNAME}.chromiumapp.org/redirect`;
export const OAUTH = `https://accounts.google.com/o/oauth2/v2/auth?client_id=443434516112-9gipi57e3v67qnp1buluec7ehrj3qdtu.apps.googleusercontent.com&prompt=select_account&response_type=token&scope=email https://www.googleapis.com/auth/drive.appdata&redirect_uri=${REDIRECT_URI}`;
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

export function checkRuntimeError() {
    chrome.runtime.lastError;
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

export function isLoggedIn() {
    return chrome.storage.local.get("token");
}

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
            id: "sendRight",
            title: "Send all tabs on right to BookTab",
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
            id: "sendLeft",
            title: "Send all tabs on left to BookTab",
            contexts: ["all"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "seperator3",
            type: "separator",
            contexts: ["action"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
    chrome.contextMenus.create(
        {
            id: "clearHistory",
            title: "Clear history of BookTab",
            contexts: ["action"],
            parentId: "booktab",
        },
        checkRuntimeError
    );
}

export async function setStorage() {
    let { user, groups, history, lastSynced, theme, root, token } =
        await chrome.storage.local.get();
    theme ?? (theme = "");
    groups ?? (groups = []);
    history ?? (history = { groups: [], tabs: [] });
    chrome.storage.local.set({
        user,
        groups,
        history,
        lastSynced,
        theme,
        root,
        token,
    });
}

export function installHandler() {
    initContextMenus();
    chrome.tabs.create({
        url: "/tab/index.html",
        index: 0,
        pinned: true,
        active: false,
    });
    setStorage();
    checks();
    console.log("installed");
}

export function startupHandler() {}

export async function getUserInfo(token) {
    const req = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await req.json();
}

export async function getToken() {
    const { token } = await chrome.storage.local.get();
    return token;
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

/**
 *
 * @returns {TabGroup}
 */
function createTabGroup() {
    return {
        id: generateId(),
        name: new Date().toString(),
        createdDate: Date.now(),
        locked: false,
        tabs: [],
    };
}

export function display() {
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
    if (groups.length === 0) groups.push(createTabGroup());
    const g = groups[0];
    g.tabs.unshift(t);
    await chrome.storage.local.set({ groups });
    chrome.runtime.sendMessage({
        context: "CHANGE",
    });
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
        close(tab);
    }
    let { groups } = await chrome.storage.local.get();
    groups.unshift(g);
    await chrome.storage.local.set({ groups });
    chrome.runtime.sendMessage({
        context: "CHANGE",
    });
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
        const tp = groups.find((g) => g?.id === targetParent);
        if (!tp) return;
        let tIndex = tp.tabs.findIndex((t) => t?.id === target);
        tp.tabs.splice(tIndex, 0, s[0]);
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
