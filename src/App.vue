<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import { operatorFromString } from "./functions/parser";
    import { Operator } from "./functions/operator";
    import { ref, computed } from "vue";

    const text = ref("");
    const error = ref("");
    const parsedOperator = computed((): Operator | null => {
        error.value = "";

        let res = null;

        try {
            res = operatorFromString(text.value);
        } catch (err) {
            console.error(err);
            error.value = String(err);
        }

        return res;
    });
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0) 100 int(-inf inf (123+(A*4)/100) x))</pre>
    <textarea name="test" id="test" v-model="text" style="width: 100%; min-height: 6em"></textarea>
    <EquationLine v-if="parsedOperator" :operator="parsedOperator" />
    {{ error }}
</template>

<style scoped></style>
