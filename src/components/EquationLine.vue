<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
    import {
        Operator,
        EmptyArgument,
        BracketedSum,
        BracketedMultiplication,
        OperatorConfig,
        PeerAlterationResult,
    } from "../functions";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";
    import { v4 as uuidv4 } from "uuid";
    import {
        useSelectFunctionStore,
        useVariablesStore,
        usePermanenceStore,
        PersistentLineStorage,
        useKeybindingsStore,
    } from "../functions";
    import PermanenceInterfacingInput from "./PermanenceInterfacingInput.vue";
    const VITE_MODE = import.meta.env.MODE;

    interface EffectMeasure {
        hasEffect: boolean;
        replacesUUID: string;
        result: Operator | null;
    }
    const rendererUUID = ref(uuidv4());
    const selectFunctionStore = useSelectFunctionStore();
    const variablesStore = useVariablesStore();
    const permanenceStore = usePermanenceStore();
    const keybindingsStore = useKeybindingsStore();

    // input to the equation line
    const props = defineProps<{
        operator: Operator;
        lineUuid: string;
        config: OperatorConfig;
        isBase: boolean;
    }>();
    const keybindingsRegisterUUID = ref(uuidv4());
    const childLineUUID = ref(uuidv4());
    const operatorParserUUID = ref(uuidv4());
    const variableNameInputUUID = ref(uuidv4());
    const exportImportStringInputUUID = ref(uuidv4());
    const katexInput = computed(() => {
        return props.operator.getFormulaString();
    });
    const uuidRefsToProcess = computed(() => {
        return props.operator.getContainedUUIDRefs();
    });
    const selectionUUID = ref("");
    const additionalSelectionUUIDs = ref([] as string[]);
    const selectedOperator = ref(null as Operator | null);
    const additionalSelectionOperators = ref([] as Operator[]);
    const selectedOperatorsParentOperator = ref(null as null | Operator);
    const selectedOperatorsFirstChildOperator = ref(null as null | Operator);
    const selectedOperatorsNextSiblingOperator = ref(null as null | Operator);
    const selectedOperatorsPrevSiblingOperator = ref(null as null | Operator);
    const selectOperator = (id: string) => {
        resetControlPanel();
        // select the operator
        selectionUUID.value = id;
        selectedOperator.value = props.operator.getOperatorByUUID(selectionUUID.value);

        // clear additional selections
        additionalSelectionUUIDs.value = [];
        additionalSelectionOperators.value = [];

        // select the adjacent Operators
        const parentOperatorResult = props.operator.findParentOperator(selectionUUID.value);
        if (parentOperatorResult != null) {
            selectedOperatorsParentOperator.value = parentOperatorResult;
        } else {
            selectedOperatorsParentOperator.value = null;
        }
        const firstChildOperatorResult = props.operator.findFirstChildOperator(selectionUUID.value);
        if (firstChildOperatorResult != null) {
            selectedOperatorsFirstChildOperator.value = firstChildOperatorResult;
        } else {
            selectedOperatorsFirstChildOperator.value = null;
        }
        const nextSiblingOperatorResult = props.operator.findNextSiblingOperator(selectionUUID.value);
        if (nextSiblingOperatorResult != null) {
            selectedOperatorsNextSiblingOperator.value = nextSiblingOperatorResult;
        } else {
            selectedOperatorsNextSiblingOperator.value = null;
        }
        const prevSiblingOperatorResult = props.operator.findPrevSiblingOperator(selectionUUID.value);
        if (prevSiblingOperatorResult != null) {
            selectedOperatorsPrevSiblingOperator.value = prevSiblingOperatorResult;
        } else {
            selectedOperatorsPrevSiblingOperator.value = null;
        }

        // trigger select graphically manually (important on e.g. load)
        if (selectedOperator.value && selectedOperator.value != null) {
            selectFunctionStore.callGraphicalSelectionHandlerCallback(rendererUUID.value, selectedOperator.value.getUUIDRef());
        }

        // set keybindings to listen here
        if (loadingComplete.value) {
            keybindingsStore.setActiveUUID(keybindingsRegisterUUID.value);
        }
    };
    const selectAdditionalOperator = (additionalUUIDs: string[]) => {
        // select the operator
        additionalSelectionUUIDs.value = additionalUUIDs;
        additionalSelectionOperators.value = [];
        additionalSelectionUUIDs.value.forEach((uuid) => {
            const operator = props.operator.getOperatorByUUID(uuid);
            if (operator != null) {
                additionalSelectionOperators.value.push(operator);
            }
        });

        // trigger select graphically manually (important on e.g. load)
        additionalSelectionUUIDs.value.forEach((uuid) => {
            selectFunctionStore.callGraphicalSelectionHandlerCallback(rendererUUID.value, Operator.UUIDRefFromUUID(uuid), true);
        });
    };

    // keybindings
    keybindingsStore.registerHandler(keybindingsRegisterUUID.value, (key: string) => {
        switch (key) {
            case "ArrowUp":
                selectParentAction();
                break;
            case "ArrowRight":
                selectNextSiblingAction();
                break;
            case "ArrowDown":
                selectFirstChildAction();
                break;
            case "ArrowLeft":
                selectPrevSiblingAction();
                break;
            default:
                keybindingsStore.unSetActiveUUID();
        }
    });
    onBeforeUnmount(() => {
        keybindingsStore.unRegisterHandler(keybindingsRegisterUUID.value);
    });

    // structure of the operations line
    enum MODES {
        NONE = "none",
        REPLACEMENT = "replacement",
        EXPORT_REPLACEMENT = "replacement_export",
        VARIABLE_DEFINITION = "var_def",
        SHOW_LATEX = "show_latex",
        SHOW_STRUCTURE = "show_structure",
        SHOW_STRUCTURE_WITH_UUIDS = "show_uuids",
    }
    const mode = ref(MODES.NONE);

    // output to the next line
    const outputOperator = ref(null as null | Operator);
    function resetControlPanel() {
        outputOperator.value = null;
        mode.value = MODES.NONE;
    }
    watch(
        props,
        () => {
            resetControlPanel();
            selectionUUID.value = "";
            selectedOperatorsParentOperator.value = null;
            selectedOperatorsFirstChildOperator.value = null;
            selectedOperatorsNextSiblingOperator.value = null;
            selectedOperatorsPrevSiblingOperator.value = null;
            selectedOperator.value = null;
            replaceWithOperator.value = null;
        },
        { deep: true }
    );
    watch(outputOperator, (newVal, oldVal) => {
        if (oldVal != null) {
            if (newVal == null) {
                // if output changes to null, make sure to change the uuid
                // this is required, because if the outputOperator changes to null and later back, the child EquationLine WILL be freshly instantiated, causing a load operation
                // we do NOT want it to load any previous values, because we now are SURE that it shouldn't contain info as we just observed the switch from hasInfo -> inputInfoIsNull
                childLineUUID.value = uuidv4();
            }
        }
    });

    // modification triggers to the current line
    const skipBaseParserEffect = ref(false);
    const selectParentAction = () => {
        const UUIDref = selectedOperatorsParentOperator.value?.getUUIDRef() ?? null;
        if (UUIDref != null) {
            selectFunctionStore.callSelectionHandlerCallback(rendererUUID.value, UUIDref);
        }
    };
    const selectFirstChildAction = () => {
        const UUIDref = selectedOperatorsFirstChildOperator.value?.getUUIDRef() ?? null;
        if (UUIDref != null) {
            selectFunctionStore.callSelectionHandlerCallback(rendererUUID.value, UUIDref);
        }
    };
    const selectNextSiblingAction = () => {
        const UUIDref = selectedOperatorsNextSiblingOperator.value?.getUUIDRef() ?? null;
        if (UUIDref != null) {
            selectFunctionStore.callSelectionHandlerCallback(rendererUUID.value, UUIDref);
        }
    };
    const selectPrevSiblingAction = () => {
        const UUIDref = selectedOperatorsPrevSiblingOperator.value?.getUUIDRef() ?? null;
        if (UUIDref != null) {
            selectFunctionStore.callSelectionHandlerCallback(rendererUUID.value, UUIDref);
        }
    };
    const replaceButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.REPLACEMENT;
        replaceWithCallback();
    };
    const replaceWithOperator = ref(null as Operator | null);
    const skipReplaceWithEffect = ref(false);
    const replaceWithCallback = () => {
        if (skipReplaceWithEffect.value) {
            skipReplaceWithEffect.value = false;
        } else {
            // real implementation >>
            if (replaceWithOperator.value == null) {
                outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, new EmptyArgument(props.config));
            } else {
                outputOperator.value = props.operator.getCopyWithReplaced(
                    selectionUUID.value,
                    replaceWithOperator.value as Operator
                );
            }
        }
    };
    const replaceWithExportButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.EXPORT_REPLACEMENT;
        replaceWithExportCallback();
    };
    const replaceWithExportOperatorString = ref("");
    watch(replaceWithExportOperatorString, () => {
        replaceWithExportCallback();
    });
    const skipReplaceWithExportEffect = ref(false);
    const replaceWithExportCallback = () => {
        if (skipReplaceWithExportEffect.value) {
            skipReplaceWithExportEffect.value = false;
        } else {
            // real implementation >>
            let replaceWithExportOperator = null as Operator | null;

            const stringInput = replaceWithExportOperatorString.value;
            if (stringInput != null && stringInput != undefined && stringInput != "") {
                let importedStuff: any = undefined;
                try {
                    importedStuff = JSON.parse(stringInput);
                } catch (error) {
                    console.warn("Could not parse json input", error);
                }

                if (importedStuff !== undefined) {
                    let importedOperator = null as Operator | null;

                    try {
                        importedOperator = Operator.generateStructure(props.config, JSON.stringify(importedStuff), false);
                    } catch (error) {
                        console.warn("Could not import operator", error);
                    }

                    if (importedOperator !== null) {
                        replaceWithExportOperator = importedOperator;
                    }
                }
            }

            if (replaceWithExportOperator == null) {
                outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, new EmptyArgument(props.config));
            } else {
                outputOperator.value = props.operator.getCopyWithReplaced(
                    selectionUUID.value,
                    replaceWithExportOperator as Operator
                );
            }
        }
    };
    const variableDefinitionButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.VARIABLE_DEFINITION;
        variableDefinitionWithCallback();
    };
    const variableDefinitionName = ref("");
    watch(variableDefinitionName, () => {
        variableDefinitionWithCallback();
    });
    const skipVariableNameEffect = ref(false);
    const variableDefinitionWithCallback = () => {
        if (skipVariableNameEffect.value) {
            skipVariableNameEffect.value = false;
        } else {
            // real implementation >>
            if (variableDefinitionName.value != "") {
                outputOperator.value = props.operator.getCopyWithPackedIntoVariable(
                    variableDefinitionName.value,
                    selectionUUID.value
                );
            } else {
                // if the variable was deleted, empty the output again
                outputOperator.value = null;
            }
            // trigger typing debounce cleanup (also when emptied again)
            variablesStore.purgeLastElementsWithNamesLeadingUpToThis(props.config, variableDefinitionName.value);
        }
    };
    const actionsHaveAnyEffectAndTheirResults = computed(() => {
        let res = {} as { [key: string]: EffectMeasure };
        let timers = {} as { [key: string]: number };
        let timer = 0;
        const startTimer = () => {
            timer = Date.now();
        };
        const logTimer = (name: string) => {
            timers[name] = Date.now() - timer;
        };

        if (selectedOperator.value != null) {
            const selOp = selectedOperator.value as Operator;

            if (selectedOperatorsParentOperator.value != null) {
                const selParent = selectedOperatorsParentOperator.value as Operator;

                // swap with subsequent
                if (selParent instanceof BracketedSum || selParent instanceof BracketedMultiplication) {
                    startTimer();
                    const actionResult = selParent
                        .commuteChildAndSubsequent(selectedOperator.value.getUUID())
                        .getCopyWithGottenRidOfUnnecessaryTerms();

                    if (Operator.assertOperatorsEquivalent(actionResult, selParent, false)) {
                        res["Commute with subsequent"] = {
                            hasEffect: false,
                            replacesUUID: "",
                            result: null,
                        };
                    } else {
                        res["Commute with subsequent"] = {
                            hasEffect: true,
                            replacesUUID: selParent.getUUID(),
                            result: actionResult,
                        };
                    }
                    logTimer("Commute with subsequent");
                }
            }

            // order operator Strings
            if (selOp instanceof BracketedMultiplication) {
                const actionResult = selOp.orderOperatorStrings();

                startTimer();
                // allows to execute getCopyWithGottenRidOfUnnecessaryTerms one level above if possible
                let target = selOp as Operator;
                if (selectedOperatorsParentOperator.value != null) {
                    const selParent = selectedOperatorsParentOperator.value as Operator;
                    target = selParent;
                }

                const newToInsert = target
                    .getCopyWithReplaced(selOp.getUUID(), actionResult)
                    .getCopyWithGottenRidOfUnnecessaryTerms(); // make sure to get rid of --() or x+0 artifacts

                res["Order Operator Strings"] = {
                    hasEffect: !Operator.assertOperatorsEquivalent(target, newToInsert),
                    replacesUUID: target.getUUID(),
                    result: newToInsert,
                };
                logTimer("Order Operator Strings");
            }

            // single-replace-modifications
            [
                "getCopyWithNumbersFolded", // Modification style Method available for all instances of Operator
                "getCopyWithGottenRidOfUnnecessaryTerms", // Modification style Method available for all instances of Operator
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(selOp)).filter((name) => name.includes("MODIFICATION")),
            ].forEach((action) => {
                const name = action
                    .replace("MODIFICATION", "")
                    .replace("getCopyWithNumbersFolded", "Fold Numbers")
                    .replace("getCopyWithGottenRidOfUnnecessaryTerms", "Cleanup Terms");

                startTimer();

                // as the `action` was extracted from filtered `getOwnPropertyNames` or manually inserted, this is should always be a valid method
                let actionResult = (selOp as any)[action]() as Operator;

                // only consider actions that change anything applicable
                if (Operator.assertOperatorsEquivalent(actionResult, selOp, false)) {
                    res[name] = {
                        hasEffect: false,
                        replacesUUID: "",
                        result: null,
                    };
                } else {
                    res[name] = {
                        hasEffect: true,
                        replacesUUID: selOp.getUUID(),
                        result: actionResult,
                    };
                }
                logTimer(name);
            });

            // multi-replace-modifications (takes additionalOperators)
            [
                "renameSwapImplementation",
                ...Object.getOwnPropertyNames(Object.getPrototypeOf(selOp)).filter((name) => name.includes("PEERALTERATION")),
            ].forEach((action) => {
                const name = action.replace("PEERALTERATION", "").replace("renameSwapImplementation", "Rename with Swap");

                startTimer();

                // as the `action` was extracted from filtered `getOwnPropertyNames` or manually inserted, this is should always be a valid method
                let actionResult = (selOp as any)[action](additionalSelectionOperators.value) as PeerAlterationResult;

                let iterator: Operator = props.operator.getCopyWithReplaced("", new EmptyArgument(props.config), true); // just get a copy. Nothing replaced
                actionResult.forEach((res) => {
                    iterator = iterator.getCopyWithReplaced(res.uuid, res.replacement, true);
                });

                // make sure it changes uuids for the next step
                iterator = iterator.getCopyWithReplaced("", new EmptyArgument(props.config), false); // just get a copy. Nothing replaced

                // only consider actions that change anything applicable
                if (Operator.assertOperatorsEquivalent(props.operator, iterator, false)) {
                    res[name] = {
                        hasEffect: false,
                        replacesUUID: "",
                        result: null,
                    };
                } else {
                    res[name] = {
                        hasEffect: true,
                        replacesUUID: props.operator.getUUID(),
                        result: iterator.getCopyWithGottenRidOfUnnecessaryTerms(), // applies this globally, which may not be intended, but I cannot do anything about it
                    };
                }
                logTimer(name);
            });
        }

        // Comment in to profile if operations generate too much latency
        // console.log(timers); // track how long the various actions took to compute

        return res;
    });
    const modificationAction = (actionEffect: EffectMeasure) => {
        resetControlPanel();

        // get the result from the modification cache and output if it has any effect
        if (actionEffect.hasEffect && actionEffect.result != null) {
            outputOperator.value = props.operator.getCopyWithReplaced(actionEffect.replacesUUID, actionEffect.result);
            return;
        }
        console.error("Something fell through, should not be executed right now");
    };
    const showLatexExportButtonAction = () => {
        resetControlPanel();
        outputOperator.value = selectedOperator.value;
        mode.value = MODES.SHOW_LATEX;
    };
    const showExportStructureButtonAction = () => {
        resetControlPanel();
        outputOperator.value = selectedOperator.value;
        mode.value = MODES.SHOW_STRUCTURE;
    };
    const showExportStructureWithUUIDsButtonAction = () => {
        resetControlPanel();
        outputOperator.value = selectedOperator.value;
        mode.value = MODES.SHOW_STRUCTURE_WITH_UUIDS;
    };
    const operatorExportToClipboardAction = () => {
        const op = selectedOperator.value;
        if (op != null) {
            const text = op.getSerializedStructure(false);

            navigator.clipboard
                .writeText(text)
                .then(() => {
                    console.log("Operator export copied to clipboard");
                })
                .catch((err) => {
                    console.error("Could not copy text: ", err);
                });
        }
    };

    // STATE AND IMPORT/EXPORT
    const loadingComplete = ref(false);
    const lineStateAllocation = computed((): PersistentLineStorage => {
        additionalSelectionUUIDs.value.length;
        return {
            operator: outputOperator.value as Operator | null,
            childUUID: childLineUUID.value,
            selectionUUID: selectionUUID.value,
            additionalSelectionUUIDs: additionalSelectionUUIDs.value,
            operatorParserUUID: operatorParserUUID.value,
            variableNameInputUUID: variableNameInputUUID.value,
            exportImportStringInputUUID: exportImportStringInputUUID.value,
            mode: String(mode.value),
        };
    });
    watch(
        lineStateAllocation,
        (newVal) => {
            // only overwrite with new stuff after fully loaded (can be sure to be a real change)
            if (loadingComplete.value) {
                permanenceStore.storeLineForUUID(props.lineUuid, newVal);
            }
        },
        {
            deep: true,
        }
    );
    onMounted(() => {
        const loaded = permanenceStore.getLineForUUID(props.config, props.lineUuid);
        resetControlPanel();

        if (loaded != null) {
            childLineUUID.value = loaded.childUUID;
            operatorParserUUID.value = loaded.operatorParserUUID;
            variableNameInputUUID.value = loaded.variableNameInputUUID;
            exportImportStringInputUUID.value = loaded.exportImportStringInputUUID;
            selectOperator(loaded.selectionUUID);
            selectAdditionalOperator(loaded.additionalSelectionUUIDs);
            outputOperator.value = loaded.operator;
            mode.value = loaded.mode as unknown as MODES;
        }
        loadingComplete.value = true;
    });

    const buttonRowUUID = ref(uuidv4());
    window.addEventListener("scroll", function () {
        const elem = document.getElementById(buttonRowUUID.value);
        elem?.style.setProperty("left", "" + (document.documentElement.scrollLeft ?? "0") + "px");
    });
</script>

<template>
    <KatexRenderer
        v-if="!isBase"
        :katex-input="katexInput"
        :uuid-refs-to-process="uuidRefsToProcess"
        @selected="selectOperator"
        @selected-additional="selectAdditionalOperator"
        :renderer-uuid="rendererUUID"
    />

    <InputToOperatorParser
        v-if="isBase"
        :textarea="true"
        :config="config"
        @parsed="(a: Operator | null) => { 
                if (skipBaseParserEffect) {
                    skipBaseParserEffect = false;
                } else {
                    outputOperator = a;
                }
            }"
        @loading-value="() => (skipBaseParserEffect = true)"
        style="margin-top: 0.5em; width: 100%; min-height: 4em"
        :uuid="operatorParserUUID"
    />

    <template v-if="selectionUUID != '' && selectedOperator != null && !isBase">
        <div class="offset-x" :id="buttonRowUUID">
            <button @click="selectParentAction" style="margin-right: 0.2em" :disabled="selectedOperatorsParentOperator == null">
                Sel. Parent
            </button>
            <button
                @click="selectFirstChildAction"
                style="margin-right: 0.2em"
                :disabled="selectedOperatorsFirstChildOperator == null"
            >
                Sel. First Child
            </button>
            <button
                @click="selectPrevSiblingAction"
                style="margin-right: 0.2em"
                :disabled="selectedOperatorsPrevSiblingOperator == null"
            >
                Sel. Previous Sibling
            </button>
            <button
                @click="selectNextSiblingAction"
                style="margin-right: 0.2em"
                :disabled="selectedOperatorsNextSiblingOperator == null"
            >
                Sel. Next Sibling
            </button>
            <div style="margin-bottom: -0.5em; width: 100%">&nbsp;</div>
            <button @click="replaceButtonAction" style="margin-right: 0.2em">Replace</button>
            <button @click="replaceWithExportButtonAction" style="margin-right: 0.2em">Replace (With Export)</button>
            <button @click="variableDefinitionButtonAction" style="margin-right: 0.2em">Define Variable</button>
            <button
                v-for="(mod, name) in actionsHaveAnyEffectAndTheirResults"
                @click="modificationAction(mod)"
                :disabled="!mod.hasEffect"
                style="margin-right: 0.2em"
            >
                {{ name }}
            </button>
            <div style="margin-bottom: -0.9em; width: 100%">&nbsp;</div>
            <button @click="showLatexExportButtonAction" style="margin-right: 0.2em; float: right">Show Latex</button>
            <button @click="showExportStructureButtonAction" style="margin-right: 0.2em; float: right">
                Show Export Structure
            </button>
            <button @click="showExportStructureWithUUIDsButtonAction" style="margin-right: 0.2em; float: right">
                Show Export Structure (UUIDs)
            </button>
            <button @click="operatorExportToClipboardAction" style="margin-right: 0.2em; float: right">
                Selected Export to Clipboard
            </button>
            <div style="margin-bottom: 0.5em; width: 100%">&nbsp;</div>
            <InputToOperatorParser
                :textarea="true"
                :config="config"
                v-show="mode == MODES.REPLACEMENT"
                @parsed="(a: Operator | null) => { 
                replaceWithOperator = a;
                replaceWithCallback() 
            }"
                @loading-value="() => (skipReplaceWithEffect = true)"
                style="margin-top: 0.5em; width: 100%; min-height: 2em"
                :uuid="operatorParserUUID"
            />
            <PermanenceInterfacingInput
                v-show="mode == MODES.VARIABLE_DEFINITION"
                v-model="variableDefinitionName"
                style="margin-top: 0.5em; width: 100%"
                :type="'input'"
                :uuid="variableNameInputUUID"
                @loading-value="() => (skipVariableNameEffect = true)"
            />
            <PermanenceInterfacingInput
                v-show="mode == MODES.EXPORT_REPLACEMENT"
                v-model="replaceWithExportOperatorString"
                style="margin-top: 0.5em; width: 100%"
                :type="'textarea'"
                :uuid="exportImportStringInputUUID"
                @loading-value="() => (skipReplaceWithExportEffect = true)"
            />
        </div>
    </template>

    <template v-if="outputOperator != null">
        <pre v-if="mode == MODES.SHOW_STRUCTURE || mode == MODES.SHOW_STRUCTURE_WITH_UUIDS">{{
            JSON.parse(outputOperator.getSerializedStructure(mode == MODES.SHOW_STRUCTURE_WITH_UUIDS))
        }}</pre>
        <template v-else-if="mode == MODES.SHOW_LATEX">
            <pre>{{ outputOperator.getExportFormulaString() }}</pre>
            <pre v-if="mode == MODES.SHOW_LATEX && VITE_MODE == 'development'">{{
                {
                    latexPasteableToJs: outputOperator.getExportFormulaString(),
                }
            }}</pre>
        </template>
        <div v-else style="margin-top: 0.1em; width: 100%">
            <EquationLine
                :operator="(outputOperator as Operator)"
                :line-uuid="childLineUUID"
                :is-base="false"
                :config="props.config"
            />
        </div>
    </template>
</template>

<style>
    .offset-x {
        position: relative;
        width: 100%;
    }
</style>
