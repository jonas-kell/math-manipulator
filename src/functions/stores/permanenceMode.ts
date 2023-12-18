// source/target modes
export enum PermanenceStorageModes {
    session = "session",
    vscode = "vscode",
    memory = "memory",
}

// overwrite mode with values set-able in html (as process.env.*** was not dynamic enough)
export function getPermanenceModeFromWindow(): PermanenceStorageModes {
    let res = PermanenceStorageModes.session;

    if (typeof window !== "undefined") {
        if ((window as any).permanenceMode != undefined && (window as any).permanenceMode != null) {
            const modeParsed = String((window as any).permanenceMode);
            if (
                modeParsed == PermanenceStorageModes.memory ||
                modeParsed == PermanenceStorageModes.session ||
                modeParsed == PermanenceStorageModes.vscode
            ) {
                res = modeParsed;
            } else {
                console.error(`Not supported value for permanenceMode ${modeParsed}`);
            }
        }
    }

    return res;
}
