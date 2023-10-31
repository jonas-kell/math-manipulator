<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { Numerical, Operator } from "../functions/operator";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";

    const props = defineProps<{
        operator: Operator;
    }>();

    const selectionUUID = ref("");
    const selectedOperator = ref(null as Operator | null);
    const selectOperator = (id: string) => {
        console.log("selection", id);
        selectionUUID.value = id;
        selectedOperator.value = props.operator.getOperatorByUUID(selectionUUID.value);
    };

    const availableModifications = computed((): string[] => {
        if (selectedOperator.value == null) {
            return [];
        }

        return Object.getOwnPropertyNames(Object.getPrototypeOf(selectedOperator.value)).filter((name) =>
            name.includes("MODIFICATION")
        );
    });

    const replaceWithOperator = ref(new Numerical(-2) as Operator);
    const replaceButtonAction = () => {
        outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, replaceWithOperator.value as Operator);
    };
    const foldButtonAction = () => {
        if (selectedOperator.value != null) {
            outputOperator.value = props.operator.getCopyWithReplaced(
                selectionUUID.value,
                selectedOperator.value.getCopyWithNumbersFolded() as Operator
            );
        } else {
            console.error("Should not be possible. Operator is null");
        }
    };
    const modificationAction = (action: string) => {
        if (selectedOperator.value != null) {
            outputOperator.value = props.operator.getCopyWithReplaced(
                // as the `action` was extracted from filtered `getOwnPropertyNames` this is should always be successful
                selectionUUID.value,
                (selectedOperator.value as any)[action]() as Operator
            );
        } else {
            console.error("Should not be possible. Operator is null");
        }
    };

    const katexInput = computed(() => {
        return props.operator.getFormulaString();
    });
    const uuidRefsToProcess = computed(() => {
        return props.operator.getContainedUUIDRefs();
    });

    watch(props, () => {
        outputOperator.value = null;
        selectionUUID.value = "";
        selectedOperator.value = null;
    });
    const outputOperator = ref(null as null | Operator);
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuid-refs-to-process="uuidRefsToProcess" @selected="selectOperator" />

    <template v-if="selectionUUID != '' && selectedOperator != null">
        <button @click="replaceButtonAction">Replace</button>
        <button @click="foldButtonAction">Fold Numbers</button>
        <button @click="modificationAction(mod)" v-for="mod in availableModifications">
            {{ mod.replace("MODIFICATION", "") }}
        </button>
        <InputToOperatorParser @parsed="(a: Operator) => {replaceWithOperator = a}" />
    </template>

    <EquationLine v-if="outputOperator != null" :operator="(outputOperator as Operator)" />
</template>
