import { defineStore } from "pinia";
import { Operator, wordsParserConsidersReserved, PersistentVariablesStoreStorage, usePermanenceStore } from "./../exporter";
import { v4 as uuidv4 } from "uuid";

interface StoreType {
    values: { [key: string]: { op: Operator | null; created: number; uuid: string } };
    recentlyCreatedVariables: string[];
    mostRecentVariableName: string;
    storeUUIDForPersistence: string | null;
}

const MAX_RECENT_LIFETIME = 1500;
const MIN_RECENT_LIFETIME = 5;

export const useVariablesStore = defineStore("variables", {
    state: (): StoreType => {
        return {
            values: {},
            recentlyCreatedVariables: [],
            mostRecentVariableName: "Will not be choose-able by user because spaces",
            storeUUIDForPersistence: null,
        };
    },
    actions: {
        makeSureVariableAvailable(name: string) {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                // ok, variable is set
            } else {
                // There NEEDS to be a new creation
                this.values[name] = { op: null, created: Date.now(), uuid: uuidv4() };
                this.storeValues();

                // cache the variable name temporarily for debouncing
                this.recentlyCreatedVariables.push(name);
                this.mostRecentVariableName = name;
                setTimeout(() => {
                    // definitely no longer in the array after MAX_RECENT_LIFETIME
                    this.recentlyCreatedVariables = removeFromArray(this.recentlyCreatedVariables, name);
                }, MAX_RECENT_LIFETIME);
            }
        },
        purgeLastElementsWithNamesLeadingUpToThis(typedString: string) {
            // when typing e.g. the variable "asdf", The variables "a" "as" "asd" get created and then linger
            // also when deleting characters, leaves a trail behind. So creating "asd" also treats "asdX"
            // deletes all variables with names that are substrings of the just created variable, that have been created not more than half a second ago

            // extract the typed variable string from the input
            const extracted = getLastStringSegment(typedString);
            const copyOfRecentlyCreated = this.recentlyCreatedVariables;

            // this is debouncing typing actions. Therefore call this on keyUp with the new text. Then here a delay is introduced, to make sure, processing on the logic side is finished
            setTimeout(() => {
                // make sure to iterate over all possible names that were present at the time of queueing the cleanup and at the time of execution
                [...new Set(copyOfRecentlyCreated.concat(this.recentlyCreatedVariables))].forEach((iterName) => {
                    const storedObject = this.values[iterName];
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
                                iterName != this.mostRecentVariableName) ||
                            // deleting single character variables
                            (extracted == "" && iterName.length == 1)
                        ) {
                            // check if the age is still allowing to delete
                            const age = Date.now() - storedObject.created;
                            if (age < MAX_RECENT_LIFETIME) {
                                // clear variable from store
                                this.removeVariableFromStore(iterName);
                                // clear possibly cleaning requirement
                                this.recentlyCreatedVariables = removeFromArray(this.recentlyCreatedVariables, iterName);
                            }
                        }
                    }
                });
            }, MIN_RECENT_LIFETIME);
        },
        setOperatorForVariable(name: string, value: Operator | null) {
            this.makeSureVariableAvailable(name);
            this.values[name].op = value;

            this.storeValues();
        },
        removeVariableFromStore(name: string) {
            delete this.values[name];

            this.storeValues();
        },
        getVariableContent(name: string): Operator | null {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                return val.op;
            } else {
                return null;
            }
        },
        getVariableUUID(name: string): string | null {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                return val.uuid;
            } else {
                return null;
            }
        },
        setUUIDForPersistence(uuid: string) {
            // delete all variables
            this.availableVariables.forEach((varName) => {
                this.removeVariableFromStore(varName);
            });

            // set new uuid
            this.storeUUIDForPersistence = uuid;

            // re-import
            const reimport = usePermanenceStore().getVariablesStoreForUUID(this.storeUUIDForPersistence);
            if (reimport && reimport != null) {
                for (const key in reimport.variables) {
                    const reimportedVariable = reimport.variables[key];
                    this.values[key] = reimportedVariable;
                }
            }
        },
        storeValues() {
            if (this.storeUUIDForPersistence != null) {
                let exp = { variables: {} } as PersistentVariablesStoreStorage;

                this.availableVariables.forEach((variableName) => {
                    const variableToExport = this.values[variableName];
                    exp.variables[variableName] = variableToExport;
                });

                usePermanenceStore().storeVariablesStoreForUUID(this.storeUUIDForPersistence, exp);
            }
        },
    },
    getters: {
        availableVariables(state): string[] {
            return Object.keys(state.values).sort((keyA, keyB) => {
                // append to end of list if is newer
                return state.values[keyA].created - state.values[keyB].created;
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
