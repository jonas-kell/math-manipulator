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

export interface PersistentVariable {
    op: Operator | null;
    created: number;
    uuid: string;
}
export interface PersistentVariablesStoreStorage {
    variables: { [key: string]: PersistentVariable };
}

interface ExportableVariable {
    op: string | null;
    created: number;
    uuid: string;
}
interface ExportablePersistentVariablesStoreStorage {
    variables: { [key: string]: ExportableVariable };
}

interface StoreType {}

export const usePermanenceStore = defineStore("permanence", {
    state: (): StoreType => {
        return {};
    },
    actions: {
        storeLineForUUID(uuid: string, values: PersistentLineStorage) {
            const toStore: ExportablePersistedLineStorage = {
                operator: values.operator == null ? null : values.operator.getSerializedStructure(true),
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
        storeVariablesStoreForUUID(uuid: string, values: PersistentVariablesStoreStorage) {
            let variables = {} as { [key: string]: ExportableVariable };

            for (const key in values.variables) {
                const element = values.variables[key];

                if (element != null && element != undefined) {
                    variables[key] = {
                        uuid: element.uuid,
                        created: element.created,
                        op: element.op != null && element.op != undefined ? element.op.getSerializedStructure(true) : null,
                    } as ExportableVariable;
                }
            }

            const toStore: ExportablePersistentVariablesStoreStorage = {
                variables: variables,
            };
            sessionStorage.setItem(uuid, JSON.stringify(toStore));
        },
        getVariablesStoreForUUID(uuid: string): PersistentVariablesStoreStorage | null {
            const loadedState = sessionStorage.getItem(uuid);

            let res = null;
            if (loadedState && loadedState != null && loadedState != undefined) {
                const loadedObject = JSON.parse(loadedState) as ExportablePersistentVariablesStoreStorage;

                let variables = {} as { [key: string]: PersistentVariable };
                for (const key in loadedObject.variables) {
                    const element = loadedObject.variables[key];

                    if (element != null && element != undefined) {
                        variables[key] = {
                            uuid: element.uuid != null && element.uuid != undefined ? element.uuid : uuidv4(),
                            created: element.created != null && element.created != undefined ? element.created : Date.now(),
                            op:
                                element.op != null && element.op != undefined
                                    ? Operator.generateStructure(element.op, true)
                                    : null,
                        } as PersistentVariable;
                    }
                }

                res = {
                    variables: variables,
                } as PersistentVariablesStoreStorage;
            }

            return res;
        },
    },
});
