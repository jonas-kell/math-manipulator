<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { Numerical, Operator } from "../functions/operator";
    import KatexRenderer from "./KatexRenderer.vue";

    const props = defineProps<{
        operator: Operator;
    }>();

    const selection = ref("");
    const selectOperator = (id: string) => {
        console.log("selection", id);
        selection.value = id;
    };

    const replaceButtonAction = () => {
        outputOperator.value = props.operator.copyWithReplaced(selection.value);
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
    // typescript is unhappy getting the Operator directly from the ref above...
    const computedRecursiveOperator = computed((): Operator => {
        if (outputOperator.value == null) {
            return new Numerical(-1);
        } else {
            return outputOperator.value as Operator;
        }
    });
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuid-refs-to-process="uuidRefsToProcess" @selected="selectOperator" />

    <template v-if="selection != ''">
        <button @click="replaceButtonAction">Replace</button>
    </template>

    <EquationLine v-if="outputOperator != null" :operator="computedRecursiveOperator" />
</template>
