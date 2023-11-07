<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { Operator, EmptyArgument, BracketedSum, BracketedMultiplication } from "../functions";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";
    import { v4 as uuidv4 } from "uuid";
    import { useSelectFunctionStore } from "./../stores/selectors";
    const VITE_MODE = import.meta.env.MODE;

    interface EffectMeasure {
        hasEffect: boolean;
        replacesUUID: string;
        result: Operator | null;
    }
    const rendererUUID = ref(uuidv4());
    const selectFunctionStore = useSelectFunctionStore();

    // input to the equation line
    const props = defineProps<{
        operator: Operator;
    }>();
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
    };

    // structure of the operations line
    enum MODES {
        NONE,
        REPLACEMENT,
        STRUCTURAL_VARIABLE_DEFINITION,
        SHOW_LATEX,
        SHOW_STRUCTURE,
    }
    const mode = ref(MODES.NONE);

    // output to the next line
    const outputOperator = ref(null as null | Operator);
    function resetControlPanel() {
        outputOperator.value = null;
        mode.value = MODES.NONE;
    }
    watch(props, () => {
        resetControlPanel();
        selectionUUID.value = "";
        selectedOperatorsParentOperator.value = null;
        selectedOperator.value = null;
        replaceWithOperator.value = null;
    });

    // modification triggers to the current line
    const selectParentAction = () => {
        const UUIDref = selectedOperatorsParentOperator.value?.getUUIDRef() ?? null;
        if (UUIDref != null) {
            selectFunctionStore.callHandlerCallback(rendererUUID.value, UUIDref);
        }
    };
    const replaceButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.REPLACEMENT;
        replaceWithCallback();
    };
    const replaceWithOperator = ref(null as Operator | null);
    const replaceWithCallback = () => {
        if (replaceWithOperator.value == null) {
            outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, new EmptyArgument());
        } else {
            outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, replaceWithOperator.value as Operator);
        }
    };
    const structuralVariableDefinitionButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.STRUCTURAL_VARIABLE_DEFINITION;
        structuralVariableDefinitionWithCallback();
    };
    const structuralVariableDefinitionName = ref("A");
    watch(structuralVariableDefinitionName, () => {
        structuralVariableDefinitionWithCallback();
    });
    const structuralVariableDefinitionWithCallback = () => {
        outputOperator.value = props.operator.getCopyWithPackedIntoStructuralVariable(
            structuralVariableDefinitionName.value == "" ? "A" : structuralVariableDefinitionName.value,
            selectionUUID.value
        );
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
        mode.value = MODES.SHOW_LATEX;
    };
    const showExportStructureButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.SHOW_STRUCTURE;
    };
</script>

<template>
    <KatexRenderer
        :katex-input="katexInput"
        :uuid-refs-to-process="uuidRefsToProcess"
        @selected="selectOperator"
        :renderer-uuid="rendererUUID"
    />

    <template v-if="selectionUUID != '' && selectedOperator != null">
        <button @click="selectParentAction" style="margin-right: 0.2em" :disabled="selectedOperatorsParentOperator == null">
            Sel. Parent
        </button>
        <button @click="replaceButtonAction" style="margin-right: 0.2em">Replace</button>
        <button @click="structuralVariableDefinitionButtonAction" style="margin-right: 0.2em">Define Structural Variable</button>
        <button
            v-for="(mod, name) in actionsHaveAnyEffectAndTheirResults"
            @click="modificationAction(mod)"
            :disabled="!mod.hasEffect"
            style="margin-right: 0.2em"
        >
            {{ name }}
        </button>
        <button @click="showLatexExportButtonAction" style="margin-right: 0.2em; float: right">Show Latex</button>
        <button @click="showExportStructureButtonAction" style="margin-right: 0.2em; float: right">Show Export Structure</button>
        <InputToOperatorParser
            v-show="mode == MODES.REPLACEMENT"
            @parsed="(a: Operator | null) => { 
                replaceWithOperator = a; 
                replaceWithCallback() 
            }"
            style="margin-top: 0.5em"
        />
        <input
            v-show="mode == MODES.STRUCTURAL_VARIABLE_DEFINITION"
            type="text"
            v-model="structuralVariableDefinitionName"
            style="margin-top: 0.5em; width: 100%"
        />
        <pre v-if="mode == MODES.SHOW_STRUCTURE">{{ JSON.parse(selectedOperator.getSerializedStructure(false)) }}</pre>
        <template v-if="mode == MODES.SHOW_LATEX">
            <pre>{{ selectedOperator.getExportFormulaString() }}</pre>
            <pre v-if="mode == MODES.SHOW_LATEX && VITE_MODE == 'development'">{{
                {
                    latexPasteableToJs: selectedOperator.getExportFormulaString(),
                }
            }}</pre>
        </template>
    </template>

    <EquationLine v-if="outputOperator != null" :operator="(outputOperator as Operator)" />
</template>
