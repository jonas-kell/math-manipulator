<script setup lang="ts">
    import { operatorFromString } from "../functions";
    import { ref, watch } from "vue";

    const emit = defineEmits(["parsed"]);

    const text = ref("");
    const error = ref("");
    watch(text, () => {
        error.value = "";

        let res = null;

        try {
            res = operatorFromString(text.value);
        } catch (err) {
            console.error(err);
            error.value = String(err);
        }

        emit("parsed", res);
    });
</script>

<template>
    <div>
        <textarea v-model="text" style="width: 100%; min-height: 4em"></textarea>
        {{ error }}
    </div>
</template>
