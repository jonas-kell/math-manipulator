<script setup lang="ts">
    import KatexRenderer from "./components/KatexRenderer.vue";
    import {
        BracketedSum,
        Number,
        Fraction,
        BigInt,
        RawLatex,
        Variable,
        StructuralVariable,
        BracketedMultiplication,
        BigSum,
    } from "./functions/operator";

    const outer = new BigSum(
        new RawLatex("n=0"),
        new RawLatex("100"),
        new BigInt(
            new RawLatex("-\\infty"),
            new RawLatex("\\infty"),
            new BracketedSum([
                new Number(123),
                new Fraction(
                    new BracketedMultiplication([new StructuralVariable("A", new Number(1)), new Number(4)]),
                    new Number(100)
                ),
            ]),
            new Variable("x")
        )
    );
</script>

<template>
    <KatexRenderer
        :katex-input="outer.getFormulaString()"
        :uuids-to-process="outer.getContainedUUIDs()"
        @selected="(id) => console.log(id)"
    />
    {{ outer.getFormulaString() }}
    <br />
    <br />
    {{ outer.exportFormulaString() }}
</template>

<style scoped></style>
