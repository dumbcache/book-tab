import { fetchLocal } from "./cache.js";
import { getToken } from "./utils.js";

const FILE_API = "https://www.googleapis.com/drive/v3/files";
const FILE_API_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
export const PAGE_SIZE = 500;

export async function checks(token) {
    token || (token = await getToken());
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
        }
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
 *
 * @param {Blob} blob
 */
function updateFile(blob, token) {
    uploadFile(
        blob,
        FILE_API_UPLOAD +
            "/" +
            "1S2QmYEKQ4nZaVFo9He_g7uDdqc_wSr3RMGt3uMMxPCYYFAFE2A",
        "PATCH",
        token
    );
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
