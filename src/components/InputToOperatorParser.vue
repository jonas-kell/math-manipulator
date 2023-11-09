<script setup lang="ts">
    import { operatorFromString, useVariablesStore } from "../functions";
    import { ref, watch } from "vue";
    import PermanenceInterfacingInput from "./PermanenceInterfacingInput.vue";

    const props = defineProps({
        textarea: {
            type: Boolean,
            default: true,
        },
        uuid: {
            type: String,
            required: true,
        },
    });

    const emit = defineEmits(["parsed"]);
    const variablesStore = useVariablesStore();

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

        // trigger typing debounce cleanup
        variablesStore.purgeLastElementsWithNamesLeadingUpToThis(text.value);
    });
</script>

<template>
    <div>
        <PermanenceInterfacingInput
            v-model="text"
            :style="($attrs.style as any)"
            :type="props.textarea ? 'textarea' : 'input'"
            :uuid="props.uuid"
        />
        {{ error }}
    </div>
</template>
