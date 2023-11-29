import { defineStore } from "pinia";
import {
    Operator,
    OperatorConfig,
    PersistentVariablesStoreStorage,
    usePermanenceStore,
    PersistentVariables as Variables,
    preProcessInputString,
    wordsParserConsidersReserved,
    wordsParserConsidersReservedIfWhitespaceSurrounded,
    useMacrosStore,
} from "./../exporter";
import { v4 as uuidv4 } from "uuid";
import { ref } from "vue";

interface VariableStash {
    variables: Variables;
    recentlyCreatedVariables: string[];
    mostRecentCustomReservedWord: string;
}

const MAX_RECENT_LIFETIME = 1500;

export const useVariablesStore = defineStore("variables", () => {
    const variableStashes = ref(
        {} as {
            [key: string]: VariableStash;
        }
    );
    const lastUpdate = ref(Date.now());
    const currentlyImporting = ref(false);

    function updateLastUpdateTimestamp() {
        lastUpdate.value = Date.now();
    }
    function makeSureVariableAvailable(config: OperatorConfig, name: string) {
        if (currentlyImporting.value) {
            // skip creation. On import we would otherwise get infinite recursion side effects
            // on import, all stuff is stored, so we must not have new Variable(...) have side effects
        } else {
            let val = getVariableStash(config).variables[name];

            if (val != undefined && val != null && val) {
                // ok, variable is set
            } else {
                // There NEEDS to be a new creation
                getVariableStash(config).variables[name] = { op: null, created: Date.now(), uuid: uuidv4() };
                updateLastUpdateTimestamp();

                storeValuesInPermanence(config);

                // cache the variable name temporarily for debouncing
                getVariableStash(config).recentlyCreatedVariables.push(name);
                setMostRecentCustomReservedWord(config, name);
                updateLastUpdateTimestamp();

                // purge (useful when variable is not last element of input)
                purgeLastElementsWithNamesLeadingUpToThis(config, name);

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
    }
    function setMostRecentCustomReservedWord(config: OperatorConfig, word: string) {
        getVariableStash(config).mostRecentCustomReservedWord = word;
    }
    function purgeLastElementsWithNamesLeadingUpToThis(config: OperatorConfig, typedString: string) {
        // when typing e.g. the variable "asdf", The variables "a" "as" "asd" get created and then linger
        // also when deleting characters, leaves a trail behind. So creating "asd" also treats "asdX"
        // deletes all variables with names that are substrings of the just created variable, that have been created not more than half a second ago

        // extract the typed variable string from the input
        const extracted = getLastStringSegment(config, typedString);
        const copyOfRecentlyCreated = getVariableStash(config).recentlyCreatedVariables;

        // this is debouncing typing actions. Therefore call this on keyUp with the new text. Then here a delay is introduced, to make sure, processing on the logic side is finished
        [...new Set(copyOfRecentlyCreated.concat(getVariableStash(config).recentlyCreatedVariables))].forEach((iterName) => {
            const storedObject = getVariableStash(config).variables[iterName];
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
                        iterName != getVariableStash(config).mostRecentCustomReservedWord) ||
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
    }
    function setOperatorForVariable(config: OperatorConfig, name: string, value: Operator | null) {
        if (currentlyImporting.value) {
            // skip creation. On import we would otherwise get infinite recursion side effects
            // on import, all stuff is stored, so we must not have new Variable(...) have side effects
        } else {
            makeSureVariableAvailable(config, name);
            getVariableStash(config).variables[name].op = value;
            updateLastUpdateTimestamp();

            storeValuesInPermanence(config);
        }
    }
    function removeVariableFromStore(config: OperatorConfig, name: string) {
        delete getVariableStash(config).variables[name];
        updateLastUpdateTimestamp();

        storeValuesInPermanence(config);
    }
    function getVariableContent(config: OperatorConfig, name: string): Operator | null {
        let val = getVariableStash(config).variables[name];

        if (val != undefined && val != null && val) {
            return val.op;
        } else {
            return null;
        }
    }
    function getVariableUUID(config: OperatorConfig, name: string): string | null {
        let val = getVariableStash(config).variables[name];

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
        let variables: Variables = {};

        // call all the constructors once and store results, to make sure that calling a variable constructor while creating another variable doesn't cause empty variable initialization later
        const buffer = {} as Variables;

        currentlyImporting.value = true; // next line possibly calls new Variable. Stop this causing recursive effects until fully initialized
        const reimport = usePermanenceStore().getVariablesStoreForUUID(config, variableStashUuid);
        currentlyImporting.value = false;

        if (reimport && reimport != null) {
            for (const key in reimport.variables) {
                const reimportedVariable = reimport.variables[key];
                buffer[key] = reimportedVariable;
            }
        }

        // overwrite locally stored values
        for (const key in buffer) {
            const storage = buffer[key];
            variables[key] = storage;
        }

        const newStash: VariableStash = {
            variables: variables,
            recentlyCreatedVariables: [],
            mostRecentCustomReservedWord: "Will not be choose-able by user because spaces",
        };
        variableStashes.value[variableStashUuid] = newStash;
        updateLastUpdateTimestamp();

        return newStash;
    }
    function storeValuesInPermanence(config: OperatorConfig) {
        let exp = { variables: {} } as PersistentVariablesStoreStorage;

        availableVariables(config).forEach((variableName) => {
            const variableToExport = getVariableStash(config).variables[variableName];
            exp.variables[variableName] = variableToExport;
        });

        usePermanenceStore().storeVariablesStoreForUUID(config.variablesListUuid, exp);
    }
    function availableVariables(config: OperatorConfig): string[] {
        return Object.keys(getVariableStash(config).variables).sort((keyA, keyB) => {
            // append to end of list if is newer
            return getVariableStash(config).variables[keyA].created - getVariableStash(config).variables[keyB].created;
        });
    }
    function getLastStringSegment(config: OperatorConfig, inputString: string): string {
        if (inputString.endsWith(" ")) {
            return "";
        }

        // surrounds all "wordsParserConsidersReserved" with white-spaces for us
        const processedInput = preProcessInputString(inputString);

        let lastIndex = -1;
        for (const delimiter of [
            ...wordsParserConsidersReservedIfWhitespaceSurrounded,
            ...wordsParserConsidersReserved,
            ...useMacrosStore().availableAllowedMacroTriggers(config), // when a macro is defined, it takes precedence over variable names
        ]) {
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
        makeSureVariableAvailable,
        purgeLastElementsWithNamesLeadingUpToThis,
        setOperatorForVariable,
        removeVariableFromStore,
        getVariableContent,
        getVariableUUID,
        availableVariables,
        setMostRecentCustomReservedWord,
    };
});
