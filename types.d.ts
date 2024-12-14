// src/declarations.d.ts
declare module "*.png";
declare module "*.svg";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.json";

declare module "*.svg?raw" {
    const content: string;
    export default content;
}

declare module "*?worker" {
    const workerConstructor: {
        new (options?: { name?: string }): Worker;
    };
    export default workerConstructor;
}

interface Selected {
    name: string;
    id: string;
    parents?: [string];
}

interface ImgMeta {
    name?: string;
    mimeType?: string;
    description?: string;
    starred?: Boolean;
    parents?: [string];
    appProperties?: {
        origin?: string;
        src?: string;
    };
}

interface DropItem {
    name: string;
    displayName: string;
    id: string;
    mimeType: string;
    url?: string;
    imgRef: string;
    status?: string;
    parent?: string;
    parentName?: string;
    file: File | Blob;
    loaded: boolean;
}
