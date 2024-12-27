import { checkRuntimeError } from "./utils";

const FILE_API = "https://www.googleapis.com/drive/v3/files";
const FILE_API_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
export const PAGE_SIZE = 500;

/**
 *
 * @param {string} [t]
 * @param {string} [u]
 */
export async function checks(token, user) {
    console.info("performing sync checks");
    let { user: u, lastSynced } = await chrome.storage.local.get();
    if (
        user &&
        user === u &&
        lastSynced &&
        Date.now() - lastSynced < 1000 * 60 * 60 * 24
    ) {
        fullSync(token);
    } else {
        partialSync(token);
    }
    let session = Date.now() + 3600 * 1000;
    await chrome.storage.local.set({ token, user, session });

    chrome.runtime.sendMessage(
        {
            context: "CHANGE",
        },
        checkRuntimeError
    );
    return;
}

export async function sync() {
    let { token, lastSynced } = await chrome.storage.local.get();
    if (lastSynced && Date.now() - lastSynced < 1000 * 60 * 60 * 24) {
        fullSync(token);
    } else {
        partialSync(token);
    }
}

function createFiles(token) {
    createImgMetadata(
        {
            name: "booktab.json",
            mimeType: "application/json",
            parents: ["appDataFolder"],
        },
        token
    ).then(async (location) => {
        uploadFile(
            new Blob([JSON.stringify({})], { type: "application/json" }),
            location,
            "PUT",
            token
        );
    });
    createImgMetadata(
        {
            name: "history.json",
            mimeType: "application/json",
            parents: ["appDataFolder"],
        },
        token
    ).then(async (location) => {
        uploadFile(
            new Blob([JSON.stringify({})], { type: "application/json" }),
            location,
            "PUT",
            token
        );
    });
}

/**
 * @param {string} id
 * @param {string} token
 */
async function downloadFile(id, token) {
    const req = await fetch(FILE_API + "/" + id + "?alt=media", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (req.status !== 200) {
        return;
    }
    return req.json();
}

/**
 *
 * @param {string} id
 * @param {string} token
 * @param {Blob} blob
 */
function updateFile(id, token, blob) {
    if (!blob) return;
    uploadFile(blob, FILE_API_UPLOAD + "/" + id, "PATCH", token);
}

/**
 *
 * @param {File | Blob} file
 * @param {string} location
 * @param {"PUT" | "PATCH"} method
 * @returns {Promise<number>}
 */
async function uploadFile(file, location, method, token) {
    const chunkSize = 20 * 256 * 1024; // 5 MB chunk size
    let offset = 0;
    let fileSize = file.size;
    while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize);

        const startByte = offset;
        const endByte = Math.min(offset + chunkSize - 1, fileSize - 1);
        const contentRange = `bytes ${startByte}-${endByte}/${fileSize}`;

        const headers = new Headers();

        headers.append("Authorization", `Bearer ${token}`);
        headers.append("Content-Length", chunk.size.toString());
        // headers.append("Content-Type", "applciation/json");
        headers.append("Content-Range", contentRange);

        const res = await fetch(location, {
            method,
            headers,
            body: chunk,
        });

        if (res.status === 200) {
            // console.info("Upload completed");
            return 200;
        }
        if (res.status !== 200 && res.status !== 308) {
            return 500;
        }
        // postMessage({
        //     context: "PROGRESS",
        //     progressType: "SAVE",
        //     id,
        //     progress: Math.trunc((endByte / fileSize) * 100),
        // });
        const rangeHeader = res.headers.get("Range");
        if (rangeHeader) {
            const [_, nextOffset] = rangeHeader.split("-").map(Number);
            offset = nextOffset + 1;
        } else {
            console.error("Range header not found in response.");
            return 500;
        }
    }
    return 200;
}

/**
 *
 * @param {ImgMeta} imgMeta
 * @param {string} token
 * @returns
 */
function createImgMetadata(imgMeta, token) {
    return new Promise(async (resolve, reject) => {
        const url = `${FILE_API_UPLOAD}?uploadType=resumable`;
        let req = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(imgMeta),
        });
        let { status, statusText } = req;
        if (status !== 200) {
            console.log(
                `error while creatingImgMetaData ${status} ${statusText}`
            );
            reject({ status });
        }
        resolve(req.headers.get("Location"));
    });
}

/**
 * @param {string} token
 */
async function fullSync(token) {
    console.info("Routed to full sync");
    const files = await getFiles(token);
    const lastSynced = Date.now();
    if (files?.length > 0) {
        const { groups, history } = await chrome.storage.local.get();
        const bblob = new Blob([JSON.stringify({ groups, lastSynced })], {
            type: "application/json",
        });
        const hblob = new Blob([JSON.stringify({ ...history, lastSynced })], {
            type: "application/json",
        });
        files.forEach((f) => {
            if (f.name === "history.json") {
                updateFile(f.id, token, hblob);
            } else if (f.name === "booktab.json") {
                updateFile(f.id, token, bblob);
            }
        });
        await chrome.storage.local.set({ lastSynced });
        chrome.runtime.sendMessage({ context: "CHANGE" });
        console.info("Sync completed");
    }
}

/**
 * @param {string} token
 */
async function partialSync(token) {
    console.info("Routed to partial sync");
    const files = await getFiles(token);

    if (files?.length > 0) {
        let bjson;

        for (let f of files) {
            if (f.name === "booktab.json") {
                bjson = await downloadFile(f.id, token);
            }
        }

        if (!bjson.lastSynced || !bjson?.groups) {
            console.info("Routing to partial sync");
            fullSync(token);
            return;
        }

        const { groups: gs, history: h } = await chrome.storage.local.get();
        let l = bjson.lastSynced;
        let lastSynced = Date.now();
        for (let g of gs) {
            if (g.modifiedDate > l) {
                let f = bjson.groups?.findIndex((b) => b.id === g.id);
                if (f === -1) {
                    bjson.groups.push(g);
                } else {
                    bjson.groups[f] = g;
                }
            }
        }
        bjson.groups.sort((a, b) => b.createdDate - a.createdDate);
        bjson.lastSynced = lastSynced;
        const bblob = new Blob([JSON.stringify(bjson)], {
            type: "application/json",
        });
        const hblob = new Blob([JSON.stringify({ ...h, lastSynced })], {
            type: "application/json",
        });
        files.forEach((f) => {
            if (f.name === "history.json") {
                updateFile(f.id, token, hblob);
            } else if (f.name === "booktab.json") {
                updateFile(f.id, token, bblob);
            }
        });
        await chrome.storage.local.set({ lastSynced, groups: bjson.groups });
        chrome.runtime.sendMessage({ context: "CHANGE" });
        console.info("Sync completed");
    }
}

async function getFiles(token) {
    const res = await fetch(
        `${FILE_API}?spaces=appDataFolder&fields=files(id,name)`,
        {
            headers: { authorization: `Bearer ${token}` },
        }
    );
    if (res.status === 200) {
        let { files } = await res.json();
        if (files?.length === 0) {
            createFiles(token);
            return;
        }
        return files;
    }
}
