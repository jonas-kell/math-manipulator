import { defineStore } from "pinia";
import { Operator } from "./../exporter";

export interface PersistentLineStorage {
    operator: Operator | null;
    childUUID: string;
}

interface ExportablePersistedLineStorage {
    operator: string | null;
    childUUID: string;
}

interface StoreType {}

export const usePermanenceStore = defineStore("permanence", {
    state: (): StoreType => {
        return {};
    },
    actions: {
        storeForUUID(uuid: string, values: PersistentLineStorage) {
            const toStore: ExportablePersistedLineStorage = {
                operator: values.operator == null ? null : values.operator.getSerializedStructure(),
                childUUID: values.childUUID,
            };
            sessionStorage.setItem(uuid, JSON.stringify(toStore));
        },
        getForUUID(uuid: string): PersistentLineStorage | null {
            const loadedState = sessionStorage.getItem(uuid);

            let res = null;
            if (loadedState && loadedState != null && loadedState != undefined) {
                const loadedObject = JSON.parse(loadedState) as ExportablePersistedLineStorage;
                res = {
                    childUUID: loadedObject.childUUID,
                    operator: loadedObject.operator == null ? null : Operator.generateStructure(loadedObject.operator, true),
                } as PersistentLineStorage;
            }

            return res;
        },
    },
});
