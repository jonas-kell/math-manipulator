import { defineStore } from "pinia";
import {
    Operator,
    OperatorConfig,
    wordsParserConsidersReserved,
    PersistentVariablesStoreStorage,
    usePermanenceStore,
    PersistentVariable,
} from "./../exporter";
import { v4 as uuidv4 } from "uuid";

interface Values {
    [key: string]: { op: Operator | null; created: number; uuid: string };
}

interface VariableStash {
    values: Values;
    recentlyCreatedVariables: string[];
    mostRecentVariableName: string;
}

interface StoreType {
    variableStashes: {
        [key: string]: VariableStash;
    };
    lastUpdate: number;
}

const MAX_RECENT_LIFETIME = 1500;
const MIN_RECENT_LIFETIME = 5;

export const useVariablesStore = defineStore("variables", {
    state: (): StoreType => {
        return {
            variableStashes: {},
            lastUpdate: Date.now(),
        };
    },
    actions: {
        updateLastUpdateTimestamp() {
            this.lastUpdate = Date.now();
        },
        makeSureVariableAvailable(config: OperatorConfig, name: string) {
            let val = this.getVariableStash(config).values[name];

            if (val != undefined && val != null && val) {
                // ok, variable is set
            } else {
                // There NEEDS to be a new creation
                this.getVariableStash(config).values[name] = { op: null, created: Date.now(), uuid: uuidv4() };
                this.updateLastUpdateTimestamp();

                this.storeValues(config);

                // cache the variable name temporarily for debouncing
                this.getVariableStash(config).recentlyCreatedVariables.push(name);
                this.getVariableStash(config).mostRecentVariableName = name;
                this.updateLastUpdateTimestamp();

                setTimeout(() => {
                    // definitely no longer in the array after MAX_RECENT_LIFETIME
                    this.getVariableStash(config).recentlyCreatedVariables = removeFromArray(
                        this.getVariableStash(config).recentlyCreatedVariables,
                        name
                    );
                    this.updateLastUpdateTimestamp();
                }, MAX_RECENT_LIFETIME);
            }
        },
        purgeLastElementsWithNamesLeadingUpToThis(config: OperatorConfig, typedString: string) {
            // when typing e.g. the variable "asdf", The variables "a" "as" "asd" get created and then linger
            // also when deleting characters, leaves a trail behind. So creating "asd" also treats "asdX"
            // deletes all variables with names that are substrings of the just created variable, that have been created not more than half a second ago

            // extract the typed variable string from the input
            const extracted = getLastStringSegment(typedString);
            const copyOfRecentlyCreated = this.getVariableStash(config).recentlyCreatedVariables;

            // this is debouncing typing actions. Therefore call this on keyUp with the new text. Then here a delay is introduced, to make sure, processing on the logic side is finished
            setTimeout(() => {
                // make sure to iterate over all possible names that were present at the time of queueing the cleanup and at the time of execution
                [...new Set(copyOfRecentlyCreated.concat(this.getVariableStash(config).recentlyCreatedVariables))].forEach(
                    (iterName) => {
                        const storedObject = this.getVariableStash(config).values[iterName];
                        // check the variable is even stored
                        if (storedObject && storedObject != null && storedObject != undefined) {
                            // check if the naming indicates typing related creation
                            if (
                                // normal typing (name gets longer)
                                (extracted.startsWith(iterName) && extracted != iterName) ||
                                // name gets shorter when deleting
                                // most recent variable must not be deleted obviously. (Required, because this happens in timeout and this could cause de-sync for very fast following inputs)
                                // therefore extra check so that the second-last character of a normally typed string doesn't delete the full name as it thinks it is a deleting motion
                                (iterName.substring(0, iterName.length - 1) == extracted &&
                                    iterName != this.getVariableStash(config).mostRecentVariableName) ||
                                // deleting single character variables
                                (extracted == "" && iterName.length == 1)
                            ) {
                                // check if the age is still allowing to delete
                                const age = Date.now() - storedObject.created;
                                if (age < MAX_RECENT_LIFETIME) {
                                    // clear variable from store
                                    this.removeVariableFromStore(config, iterName);
                                    // clear possibly cleaning requirement
                                    this.getVariableStash(config).recentlyCreatedVariables = removeFromArray(
                                        this.getVariableStash(config).recentlyCreatedVariables,
                                        iterName
                                    );
                                    this.updateLastUpdateTimestamp();
                                }
                            }
                        }
                    }
                );
            }, MIN_RECENT_LIFETIME);
        },
        setOperatorForVariable(config: OperatorConfig, name: string, value: Operator | null) {
            this.makeSureVariableAvailable(config, name);
            this.getVariableStash(config).values[name].op = value;
            this.updateLastUpdateTimestamp();

            this.storeValues(config);
        },
        removeVariableFromStore(config: OperatorConfig, name: string) {
            delete this.getVariableStash(config).values[name];
            this.updateLastUpdateTimestamp();

            this.storeValues(config);
        },
        getVariableContent(config: OperatorConfig, name: string): Operator | null {
            let val = this.getVariableStash(config).values[name];

            if (val != undefined && val != null && val) {
                return val.op;
            } else {
                return null;
            }
        },
        getVariableUUID(config: OperatorConfig, name: string): string | null {
            let val = this.getVariableStash(config).values[name];

            if (val != undefined && val != null && val) {
                return val.uuid;
            } else {
                return null;
            }
        },
        // TODO migrate to new config-style
        getVariableStash(config: OperatorConfig): VariableStash {
            const variableStashUuid = config.variablesListUuid;

            // is initialized, return it
            if (Object.keys(this.variableStashes).includes(variableStashUuid)) {
                return this.variableStashes[variableStashUuid];
            }

            // fresh initialization needed
            // delete all variables, while not using the access functions that remove the stored values
            let values: Values = {};

            // call all the constructors once and store results, to make sure that calling a variable constructor while creating another variable doesn't cause empty variable initialization later
            const buffer = {} as { [key: string]: PersistentVariable };
            const reimport = usePermanenceStore().getVariablesStoreForUUID(config, variableStashUuid);
            if (reimport && reimport != null) {
                for (const key in reimport.variables) {
                    const reimportedVariable = reimport.variables[key];
                    buffer[key] = reimportedVariable;
                }
            }

            // overwrite locally stored values
            for (const key in buffer) {
                const storage = buffer[key];
                values[key] = storage;
            }

            const newStash: VariableStash = {
                values: values,
                recentlyCreatedVariables: [],
                mostRecentVariableName: "Will not be choose-able by user because spaces",
            };
            this.variableStashes[variableStashUuid] = newStash;
            this.updateLastUpdateTimestamp();

            return newStash;
        },
        storeValues(config: OperatorConfig) {
            // TODO chick if removed if is in fact needed
            let exp = { variables: {} } as PersistentVariablesStoreStorage;

            this.availableVariables(config).forEach((variableName) => {
                const variableToExport = this.getVariableStash(config).values[variableName];
                exp.variables[variableName] = variableToExport;
            });

            usePermanenceStore().storeVariablesStoreForUUID(config.variablesListUuid, exp);
        },
        availableVariables(config: OperatorConfig): string[] {
            return Object.keys(this.getVariableStash(config).values).sort((keyA, keyB) => {
                // append to end of list if is newer
                return this.getVariableStash(config).values[keyA].created - this.getVariableStash(config).values[keyB].created;
            });
        },
    },
});

function getLastStringSegment(inputString: string): string {
    const whiteSpacesRemoved = inputString.replace(/\s/g, "");
    const whiteSpacesToSpaces = inputString.replace(/\s/g, " ");

    let lastIndex = -1;
    for (const delimiter of [...wordsParserConsidersReserved, " "]) {
        // if ends with reserved word, this may be returned
        if (whiteSpacesRemoved.endsWith(delimiter)) {
            return delimiter;
        }

        // Find the last occurrence of any delimiter
        const index = whiteSpacesToSpaces.lastIndexOf(delimiter);
        if (index > lastIndex) {
            lastIndex = index;
        }
    }

    // Extract the substring from the last delimiter to the end
    const lastElement = whiteSpacesToSpaces.substring(lastIndex + 1).replace(/\s/g, "");

    return lastElement;
}

function removeFromArray(arr: string[], elem: string): string[] {
    const index = arr.indexOf(elem);

    if (index >= 0 && index < arr.length) {
        return [...arr.slice(0, index), ...arr.slice(index + 1)];
    } else {
        return arr;
    }
}
