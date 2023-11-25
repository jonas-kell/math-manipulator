<script setup lang="ts"></script>

<template>
    <h1>Welcome to Math Manipulator</h1>

    <p>
        This is a tool written by <a href="https://github.com/jonas-kell/" target="_blank">Jonas Kell</a> out of personal interest
        and for academic use.
    </p>
    <p>
        The purpose of this tool is to provide help with writing LaTex math formulas faster and in easier syntax, as well as
        providing a mathematical playground with refactor support.
    </p>
    <p>
        It aims to take care of repetitive or boring hand-work like distributing terms, ordering products, performing commutations
        evaluating numerical calculations, etc. while at the same time allowing for all the freedoms one has when doing math on
        paper.
    </p>
    <br />
    <br />
    <p>To understand how the project works, head to the <router-link to="/help">Help-Playground</router-link></p>
    <p>Or <router-link to="/empty">start with an empty project</router-link>.</p>
    <br />
    <br />
    <p>
        The <a href="https://github.com/jonas-kell/math-manipulator/" target="_blank">Project-Source-Code</a> code is available on
        GitHub.
    </p>
    <p>
        A <a href="https://jonas-kell.github.io/math-manipulator/#/" target="_blank">Hosted Version</a> of the project is
        available on GithubPages. All calculations are performed in the browser and no data is ever uploaded or processed on a
        server.
    </p>
    <p>
        Finally, there currently exists a
        <a href="https://marketplace.visualstudio.com/items?itemName=jonas-kell.math-manipulator" target="_blank"
            >VS-Code Extension</a
        >
        that provides the possibility for storing in local files.
    </p>
    <p>
        This is a research project, so I can not provide support in any capacity or guarantee API compatibility for stored
        files/code.
    </p>
</template>
