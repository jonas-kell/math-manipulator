import { defineStore } from "pinia";
import {
    Operator,
    OperatorConfig,
    PersistentVariablesStoreStorage,
    usePermanenceStore,
    PersistentVariable,
    preProcessInputString,
    wordsParserConsidersReserved,
    wordsParserConsidersReservedIfWhitespaceSurrounded,
} from "./../exporter";
import { v4 as uuidv4 } from "uuid";
import { ref } from "vue";

interface Values {
    [key: string]: { op: Operator | null; created: number; uuid: string };
}

interface VariableStash {
    values: Values;
    recentlyCreatedVariables: string[];
    mostRecentVariableName: string;
}

const MAX_RECENT_LIFETIME = 1500;
const MIN_RECENT_LIFETIME = 5;

export const useVariablesStore = defineStore("variables", () => {
    const variableStashes = ref(
        {} as {
            [key: string]: VariableStash;
        }
    );
    const lastUpdate = ref(Date.now());

    function updateLastUpdateTimestamp() {
        lastUpdate.value = Date.now();
    }
    function makeSureVariableAvailable(config: OperatorConfig, name: string) {
        let val = getVariableStash(config).values[name];

        if (val != undefined && val != null && val) {
            // ok, variable is set
        } else {
            // There NEEDS to be a new creation
            getVariableStash(config).values[name] = { op: null, created: Date.now(), uuid: uuidv4() };
            updateLastUpdateTimestamp();

            storeValues(config);

            // cache the variable name temporarily for debouncing
            getVariableStash(config).recentlyCreatedVariables.push(name);
            getVariableStash(config).mostRecentVariableName = name;
            updateLastUpdateTimestamp();

            setTimeout(() => {
                // definitely no longer in the array after MAX_RECENT_LIFETIME
                getVariableStash(config).recentlyCreatedVariables = removeFromArray(
                    getVariableStash(config).recentlyCreatedVariables,
                    name
                );
                updateLastUpdateTimestamp();
            }, MAX_RECENT_LIFETIME);
        }
    }
    function purgeLastElementsWithNamesLeadingUpToThis(config: OperatorConfig, typedString: string) {
        // when typing e.g. the variable "asdf", The variables "a" "as" "asd" get created and then linger
        // also when deleting characters, leaves a trail behind. So creating "asd" also treats "asdX"
        // deletes all variables with names that are substrings of the just created variable, that have been created not more than half a second ago

        // extract the typed variable string from the input
        const extracted = getLastStringSegment(typedString);
        const copyOfRecentlyCreated = getVariableStash(config).recentlyCreatedVariables;

        // this is debouncing typing actions. Therefore call this on keyUp with the new text. Then here a delay is introduced, to make sure, processing on the logic side is finished
        setTimeout(() => {
            // make sure to iterate over all possible names that were present at the time of queueing the cleanup and at the time of execution
            [...new Set(copyOfRecentlyCreated.concat(getVariableStash(config).recentlyCreatedVariables))].forEach((iterName) => {
                const storedObject = getVariableStash(config).values[iterName];
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
                            iterName != getVariableStash(config).mostRecentVariableName) ||
                        // deleting single character variables
                        (extracted == "" && iterName.length == 1)
                    ) {
                        // check if the age is still allowing to delete
                        const age = Date.now() - storedObject.created;
                        if (age < MAX_RECENT_LIFETIME) {
                            // clear variable from store
                            removeVariableFromStore(config, iterName);
                            // clear possibly cleaning requirement
                            getVariableStash(config).recentlyCreatedVariables = removeFromArray(
                                getVariableStash(config).recentlyCreatedVariables,
                                iterName
                            );
                            updateLastUpdateTimestamp();
                        }
                    }
                }
            });
        }, MIN_RECENT_LIFETIME);
    }
    function setOperatorForVariable(config: OperatorConfig, name: string, value: Operator | null) {
        makeSureVariableAvailable(config, name);
        getVariableStash(config).values[name].op = value;
        updateLastUpdateTimestamp();

        storeValues(config);
    }
    function removeVariableFromStore(config: OperatorConfig, name: string) {
        delete getVariableStash(config).values[name];
        updateLastUpdateTimestamp();

        storeValues(config);
    }
    function getVariableContent(config: OperatorConfig, name: string): Operator | null {
        let val = getVariableStash(config).values[name];

        if (val != undefined && val != null && val) {
            return val.op;
        } else {
            return null;
        }
    }
    function getVariableUUID(config: OperatorConfig, name: string): string | null {
        let val = getVariableStash(config).values[name];

        if (val != undefined && val != null && val) {
            return val.uuid;
        } else {
            return null;
        }
    }
    function getVariableStash(config: OperatorConfig): VariableStash {
        const variableStashUuid = config.variablesListUuid;

        // is initialized, return it
        if (Object.keys(variableStashes.value).includes(variableStashUuid)) {
            return variableStashes.value[variableStashUuid];
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
        variableStashes.value[variableStashUuid] = newStash;
        updateLastUpdateTimestamp();

        return newStash;
    }
    function storeValues(config: OperatorConfig) {
        let exp = { variables: {} } as PersistentVariablesStoreStorage;

        availableVariables(config).forEach((variableName) => {
            const variableToExport = getVariableStash(config).values[variableName];
            exp.variables[variableName] = variableToExport;
        });

        usePermanenceStore().storeVariablesStoreForUUID(config.variablesListUuid, exp);
    }
    function availableVariables(config: OperatorConfig): string[] {
        return Object.keys(getVariableStash(config).values).sort((keyA, keyB) => {
            // append to end of list if is newer
            return getVariableStash(config).values[keyA].created - getVariableStash(config).values[keyB].created;
        });
    }
    function getLastStringSegment(inputString: string): string {
        if (inputString.endsWith(" ")) {
            return "";
        }

        // surrounds all "wordsParserConsidersReserved" with white-spaces for us
        const processedInput = preProcessInputString(inputString);

        let lastIndex = -1;
        for (const delimiter of [...wordsParserConsidersReservedIfWhitespaceSurrounded, ...wordsParserConsidersReserved]) {
            const surroundedDelimiter = " " + delimiter + " ";

            // if ends with reserved delimiter, this may be returned
            if (processedInput.endsWith(surroundedDelimiter)) {
                return delimiter;
            }

            // Find the last occurrence of any delimiter
            const index = processedInput.lastIndexOf(surroundedDelimiter);
            // equals, because last " " matched before could now be first " " and in this case we need to make sure to add the length
            if (index >= lastIndex && index != -1) {
                lastIndex = index + surroundedDelimiter.length - 1;
            }
        }

        // Extract the substring from the last delimiter to the end
        const lastNonReservedSegment = processedInput.substring(lastIndex).trim();

        // if there are spaces left, select from last
        const trueLastSegment = lastNonReservedSegment.substring(lastNonReservedSegment.lastIndexOf(" ")).trim();

        return trueLastSegment;
    }
    function removeFromArray(arr: string[], elem: string): string[] {
        const index = arr.indexOf(elem);

        if (index >= 0 && index < arr.length) {
            return [...arr.slice(0, index), ...arr.slice(index + 1)];
        } else {
            return arr;
        }
    }

    return {
        lastUpdate,
        updateLastUpdateTimestamp,
        makeSureVariableAvailable,
        purgeLastElementsWithNamesLeadingUpToThis,
        setOperatorForVariable,
        removeVariableFromStore,
        getVariableContent,
        getVariableUUID,
        getVariableStash,
        storeValues,
        availableVariables,
    };
});
