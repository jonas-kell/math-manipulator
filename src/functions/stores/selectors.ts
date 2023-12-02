import { defineStore } from "pinia";

type Handler = (UUIDRef: string, additional: boolean) => {};

interface StoreType {
    registeredSelectionHandlers: { [key: string]: Handler };
    registeredGraphicalSelectionHandlers: { [key: string]: Handler };
}

export const useSelectFunctionStore = defineStore("selectors", {
    state: (): StoreType => {
        return { registeredSelectionHandlers: {}, registeredGraphicalSelectionHandlers: {} };
    },
    actions: {
        addSelectionHandlerToStore(rendererUUID: string, callback: Handler) {
            this.registeredSelectionHandlers[rendererUUID] = callback;
        },
        addGraphicalSelectionHandlerToStore(rendererUUID: string, callback: Handler) {
            this.registeredGraphicalSelectionHandlers[rendererUUID] = callback;
        },
        removeSelectionHandlerFromStore(rendererUUID: string) {
            delete this.registeredSelectionHandlers[rendererUUID];
        },
        removeGraphicalSelectionHandlerFromStore(rendererUUID: string) {
            delete this.registeredGraphicalSelectionHandlers[rendererUUID];
        },
        callSelectionHandlerCallback(rendererUUID: string, UUIDRefToCallWith: string, additional: boolean = true) {
            let func = this.registeredSelectionHandlers[rendererUUID];

            if (func != undefined) {
                (func as Handler)(UUIDRefToCallWith, additional);
            } else {
                console.error("There was no selection handler registered...", rendererUUID, UUIDRefToCallWith, additional);
            }
        },
        callGraphicalSelectionHandlerCallback(rendererUUID: string, UUIDRefToCallWith: string, additional: boolean = true) {
            let func = this.registeredGraphicalSelectionHandlers[rendererUUID];

            if (func != undefined) {
                (func as Handler)(UUIDRefToCallWith, additional);
            } else {
                console.error(
                    "There was no graphical selection handler registered...",
                    rendererUUID,
                    UUIDRefToCallWith,
                    additional
                );
            }
        },
    },
});
