<script setup lang="ts">
    import { computed } from "vue";

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
</script>

<template>
    <textarea v-model="localValue" :style="($attrs.style as any)" v-if="props.type == 'textarea'"></textarea>
    <input v-model="localValue" :style="($attrs.style as any)" v-else />
</template>
