import { defineStore } from "pinia";
import { Operator } from "./../exporter";
import { v4 as uuidv4 } from "uuid";

export interface PersistentLineStorage {
    operator: Operator | null;
    childUUID: string;
    selectionUUID: string;
    operatorParserUUID: string;
    variableNameInputUUID: string;
    mode: string;
}

interface ExportablePersistedLineStorage {
    operator: string | null;
    childUUID: string;
    selectionUUID: string;
    operatorParserUUID: string;
    variableNameInputUUID: string;
    mode: string;
}

export interface PersistentInputStorage {
    textValue: string;
}

interface StoreType {}

export const usePermanenceStore = defineStore("permanence", {
    state: (): StoreType => {
        return {};
    },
    actions: {
        storeLineForUUID(uuid: string, values: PersistentLineStorage) {
            const toStore: ExportablePersistedLineStorage = {
                operator: values.operator == null ? null : values.operator.getSerializedStructure(),
                childUUID: values.childUUID,
                selectionUUID: values.selectionUUID,
                operatorParserUUID: values.operatorParserUUID,
                variableNameInputUUID: values.variableNameInputUUID,
                mode: values.mode,
            };
            sessionStorage.setItem(uuid, JSON.stringify(toStore));
        },
        getLineForUUID(uuid: string): PersistentLineStorage | null {
            const loadedState = sessionStorage.getItem(uuid);

            let res = null;
            if (loadedState && loadedState != null && loadedState != undefined) {
                const loadedObject = JSON.parse(loadedState) as ExportablePersistedLineStorage;
                res = {
                    operator:
                        loadedObject.operator != null && loadedObject.operator != undefined
                            ? Operator.generateStructure(loadedObject.operator, true)
                            : null,
                    childUUID:
                        loadedObject.childUUID != null && loadedObject.childUUID != undefined ? loadedObject.childUUID : uuidv4(),
                    selectionUUID:
                        loadedObject.selectionUUID != null && loadedObject.selectionUUID != undefined
                            ? loadedObject.selectionUUID
                            : uuidv4(),
                    operatorParserUUID:
                        loadedObject.operatorParserUUID != null && loadedObject.operatorParserUUID != undefined
                            ? loadedObject.operatorParserUUID
                            : uuidv4(),
                    variableNameInputUUID:
                        loadedObject.variableNameInputUUID != null && loadedObject.variableNameInputUUID != undefined
                            ? loadedObject.variableNameInputUUID
                            : uuidv4(),
                    mode: loadedObject.mode != null && loadedObject.mode != undefined ? loadedObject.mode : uuidv4(),
                } as PersistentLineStorage;
            }

            return res;
        },
        storeInputForUUID(uuid: string, values: PersistentInputStorage) {
            const toStore: PersistentInputStorage = {
                textValue: values.textValue,
            };
            sessionStorage.setItem(uuid, JSON.stringify(toStore));
        },
        getInputForUUID(uuid: string): PersistentInputStorage | null {
            const loadedState = sessionStorage.getItem(uuid);

            let res = null;
            if (loadedState && loadedState != null && loadedState != undefined) {
                const loadedObject = JSON.parse(loadedState) as PersistentInputStorage;
                res = {
                    textValue:
                        loadedObject.textValue != null && loadedObject.textValue != undefined ? loadedObject.textValue : "",
                } as PersistentInputStorage;
            }

            return res;
        },
    },
});
