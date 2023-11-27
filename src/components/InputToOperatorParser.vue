<script setup lang="ts">
    import { OperatorConfig, operatorFromString, useVariablesStore } from "../functions";
    import { ref, watch } from "vue";
    import PermanenceInterfacingInput from "./PermanenceInterfacingInput.vue";

    const props = defineProps<{
        textarea: boolean;
        uuid: string;
        config: OperatorConfig;
    }>();
    const emit = defineEmits(["parsed", "loadingValue"]);
    const variablesStore = useVariablesStore();

    const text = ref("");
    const error = ref("");
    watch(text, () => {
        error.value = "";

        let res = null;

        if (text.value != "") {
            try {
                res = operatorFromString(props.config, text.value);
            } catch (err) {
                console.error(err);
                error.value = String(err);
            }
        }
        emit("parsed", res);

        // trigger typing debounce cleanup
        variablesStore.purgeLastElementsWithNamesLeadingUpToThis(props.config, text.value);
    });
</script>

<template>
    <div>
        <PermanenceInterfacingInput
            :key="props.uuid"
            v-model="text"
            :style="($attrs.style as any)"
            :type="props.textarea ? 'textarea' : 'input'"
            :uuid="props.uuid"
            @loading-value="emit('loadingValue')"
        />
        {{ error }}
    </div>
</template>
