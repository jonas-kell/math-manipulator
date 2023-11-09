<script setup lang="ts">
    import { computed, onBeforeMount, watch } from "vue";
    import { PersistentInputStorage, usePermanenceStore } from "./../functions";

    const props = defineProps<{
        modelValue: string;
        uuid: string;
        type: "input" | "textarea";
    }>();
    const emit = defineEmits(["update:modelValue"]);

    const localValue = computed({
        get: () => props.modelValue,
        set: (value) => {
            emit("update:modelValue", value);
        },
    });

    // STATE AND IMPORT/EXPORT
    const permanenceStore = usePermanenceStore();
    const inputStateAllocation = computed((): PersistentInputStorage => {
        return {
            textValue: localValue.value,
        };
    });
    watch(
        inputStateAllocation,
        (newVal) => {
            permanenceStore.storeInputForUUID(props.uuid, newVal);
        },
        {
            deep: true,
        }
    );
    onBeforeMount(() => {
        const loaded = permanenceStore.getInputForUUID(props.uuid);

        if (loaded != null) {
            localValue.value = loaded.textValue;
        }
    });
</script>

<template>
    <textarea v-model="localValue" :style="($attrs.style as any)" v-if="props.type == 'textarea'"></textarea>
    <input v-model="localValue" :style="($attrs.style as any)" v-else />
</template>
