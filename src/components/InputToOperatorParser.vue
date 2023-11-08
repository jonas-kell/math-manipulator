<script setup lang="ts">
    import { operatorFromString } from "../functions";
    import { ref, watch } from "vue";

    const props = defineProps({
        textarea: {
            type: Boolean,
            default: true,
        },
    });

    const emit = defineEmits(["parsed"]);

    const text = ref("");
    const error = ref("");
    watch(text, () => {
        error.value = "";

        let res = null;

        if (text.value != "") {
            try {
                res = operatorFromString(text.value);
            } catch (err) {
                console.error(err);
                error.value = String(err);
            }
        }

        emit("parsed", res);
    });
</script>

<template>
    <div>
        <textarea v-model="text" :style="($attrs.style as any)" v-if="props.textarea"></textarea>
        <input v-model="text" :style="($attrs.style as any)" v-else />
        {{ error }}
    </div>
</template>
