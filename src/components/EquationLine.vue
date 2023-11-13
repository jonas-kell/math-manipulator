<script setup lang="ts">
    import { computed, onMounted, ref, watch } from "vue";
    import { Operator, EmptyArgument, BracketedSum, BracketedMultiplication } from "../functions";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";
    import { v4 as uuidv4 } from "uuid";
    import { useSelectFunctionStore, useVariablesStore, usePermanenceStore, PersistentLineStorage } from "../functions";
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

    // input to the equation line
    const props = defineProps<{
        operator: Operator;
        lineUuid: string;
        isBase: boolean;
    }>();
    const childLineUUID = ref(uuidv4());
    const operatorParserUUID = ref(uuidv4());
    const variableNameInputUUID = ref(uuidv4());
    const katexInput = computed(() => {
        return props.operator.getFormulaString();
    });
    const uuidRefsToProcess = computed(() => {
        return props.operator.getContainedUUIDRefs();
    });
    const selectionUUID = ref("");
    const selectedOperator = ref(null as Operator | null);
    const selectedOperatorsParentOperator = ref(null as null | Operator);
    const selectOperator = (id: string) => {
        resetControlPanel();
        selectionUUID.value = id;
        selectedOperator.value = props.operator.getOperatorByUUID(selectionUUID.value);
        const parentOperatorResult = props.operator.findParentOperator(selectionUUID.value);
        if (parentOperatorResult != null) {
            selectedOperatorsParentOperator.value = parentOperatorResult;
        } else {
            selectedOperatorsParentOperator.value = null;
        }
        // trigger select graphically manually (important on e.g. load)
        if (selectedOperator.value && selectedOperator.value != null) {
            selectFunctionStore.callGraphicalSelectionHandlerCallback(rendererUUID.value, selectedOperator.value.getUUIDRef());
        }
    };

    // structure of the operations line
    enum MODES {
        NONE,
        REPLACEMENT,
        STRUCTURAL_VARIABLE_DEFINITION,
        SHOW_LATEX,
        SHOW_STRUCTURE,
        SHOW_STRUCTURE_WITH_UUIDS,
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
            selectedOperator.value = null;
            replaceWithOperator.value = null;
        },
        { deep: true }
    );

    // modification triggers to the current line
    const skipBaseParserEffect = ref(false);
    const selectParentAction = () => {
        const UUIDref = selectedOperatorsParentOperator.value?.getUUIDRef() ?? null;
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
                outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, new EmptyArgument());
            } else {
                outputOperator.value = props.operator.getCopyWithReplaced(
                    selectionUUID.value,
                    replaceWithOperator.value as Operator
                );
            }
        }
    };
    const variableDefinitionButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.STRUCTURAL_VARIABLE_DEFINITION;
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

                // trigger typing debounce cleanup
                variablesStore.purgeLastElementsWithNamesLeadingUpToThis(variableDefinitionName.value);
            }
        }
    };
    const actionsHaveAnyEffectAndTheirResults = computed(() => {
        let res = {} as { [key: string]: EffectMeasure };

        if (selectedOperator.value != null) {
            const selOp = selectedOperator.value as Operator;

            if (selectedOperatorsParentOperator.value != null) {
                const selParent = selectedOperatorsParentOperator.value as Operator;

                // swap with subsequent
                if (selParent instanceof BracketedSum || selParent instanceof BracketedMultiplication) {
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
                }
            }

            // order operator Strings
            if (selOp instanceof BracketedMultiplication) {
                const actionResult = selOp.orderOperatorStrings();

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
            });
        }

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

    // STATE AND IMPORT/EXPORT
    const loadingComplete = ref(false);
    const lineStateAllocation = computed((): PersistentLineStorage => {
        return {
            operator: outputOperator.value as Operator | null,
            childUUID: childLineUUID.value,
            selectionUUID: selectionUUID.value,
            operatorParserUUID: operatorParserUUID.value,
            variableNameInputUUID: variableNameInputUUID.value,
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
        const loaded = permanenceStore.getLineForUUID(props.lineUuid);
        resetControlPanel();

        if (loaded != null) {
            childLineUUID.value = loaded.childUUID;
            operatorParserUUID.value = loaded.operatorParserUUID;
            variableNameInputUUID.value = loaded.variableNameInputUUID;
            selectOperator(loaded.selectionUUID);
            outputOperator.value = loaded.operator;
            mode.value = loaded.mode as unknown as MODES;
        }
        loadingComplete.value = true;
    });
</script>

<template>
    <KatexRenderer
        :katex-input="katexInput"
        :uuid-refs-to-process="uuidRefsToProcess"
        @selected="selectOperator"
        :renderer-uuid="rendererUUID"
    />

    <InputToOperatorParser
        v-if="isBase"
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
        <button @click="selectParentAction" style="margin-right: 0.2em" :disabled="selectedOperatorsParentOperator == null">
            Sel. Parent
        </button>
        <button @click="replaceButtonAction" style="margin-right: 0.2em">Replace</button>
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
        <button @click="showExportStructureButtonAction" style="margin-right: 0.2em; float: right">Show Export Structure</button>
        <button @click="showExportStructureWithUUIDsButtonAction" style="margin-right: 0.2em; float: right">
            Show Export Structure (UUIDs)
        </button>
        <div style="margin-bottom: 0.5em; width: 100%">&nbsp;</div>
        <InputToOperatorParser
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
            v-show="mode == MODES.STRUCTURAL_VARIABLE_DEFINITION"
            v-model="variableDefinitionName"
            style="margin-top: 0.5em; width: 100%"
            :type="'input'"
            :uuid="variableNameInputUUID"
            @loading-value="() => (skipVariableNameEffect = true)"
        />
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
            <EquationLine :operator="(outputOperator as Operator)" :line-uuid="childLineUUID" :is-base="false" />
        </div>
    </template>
</template>
