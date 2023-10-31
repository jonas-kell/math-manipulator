<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { Numerical, Operator } from "../functions/operator";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";

    const props = defineProps<{
        operator: Operator;
    }>();

    const selection = ref("");
    const selectOperator = (id: string) => {
        console.log("selection", id);
        selection.value = id;
    };

    const replaceWithOperator = ref(new Numerical(-2) as Operator);
    const replaceButtonAction = () => {
        outputOperator.value = props.operator.copyWithReplaced(selection.value, replaceWithOperator.value as Operator);
    };

    const katexInput = computed(() => {
        return props.operator.getFormulaString();
    });
    const uuidRefsToProcess = computed(() => {
        return props.operator.getContainedUUIDRefs();
    });

    watch(props, () => {
        outputOperator.value = null;
        selection.value = "";
    });
    const outputOperator = ref(null as null | Operator);
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuid-refs-to-process="uuidRefsToProcess" @selected="selectOperator" />

    <template v-if="selection != ''">
        <button @click="replaceButtonAction">Replace</button>
        <InputToOperatorParser @parsed="(a: Operator) => {replaceWithOperator = a}" />
    </template>

    <EquationLine v-if="outputOperator != null" :operator="(outputOperator as Operator)" />
</template>
