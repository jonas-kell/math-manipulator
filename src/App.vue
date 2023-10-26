<script setup lang="ts">
    import KatexRenderer from "./components/KatexRenderer.vue";
    import { ref, computed } from "vue";
    import { v4 as uuidv4 } from "uuid";

    const outerId = ref("ref_" + uuidv4());
    const innerId = ref("ref_" + uuidv4());

    const katexInput = `
     \\htmlId{${outerId.value}}{\\left( \\frac{f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f (\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi}{asd} \\htmlId{${innerId.value}}{\\left(asd\\right)} \\right)}
                `;

    const ids = computed(() => {
        return [outerId.value, innerId.value];
    });
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuids-to-process="ids" @selected="(id) => console.log(id)" />
</template>

<style scoped></style>
