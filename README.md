This is a demo tool for repeat submit form data by chrome extensition

When you click the form, the target page will recieve a window message. you can handle it like this

```
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event){
  console.log(event.data)
  if (event.data.name == 'login')
    formValue.value.user = event.data.body
}


```

# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
